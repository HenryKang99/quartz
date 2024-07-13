---
title: 'Spring高级'
categories: ''
description: ''
order: 0
date: 2023-01
---

## 循环依赖问题

**场景**：最简单的循环依赖，两个类 A、B 的属性中互相持有对方实例的引用，即：

```java
class A {
    B b;
}
class B {
    A a;
}
```

假设实例的初始化顺序为 A、B，且都是单例。回顾 [[BackEnd/Spring入门#生命周期|Bean 的生命周期]]，当 A 的实例 a 通过构造方法构造完成后，需要进行自动装配，即注入 B 的实例 b，从而触发 B 的构造，而 b 构造完成后又需要注入 a，从而陷入循环。

**(下面的分析都基于这个场景。)**

### 结论

先说结论，Spring 使用三级缓存解决单例循环依赖问题，三级缓存是三个 map，定义如下：

```java
// 第一级缓存，即单例池，保存初始化完成的单例 bean
Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);  

// 第二级缓存，存放初始化未完成的 bean
Map<String, Object> earlySingletonObjects = new ConcurrentHashMap<>(16);
  
// 第三级缓存，用来打破循环，保存的 value 是一个 ObjectFactory 接口实现类对象
Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);  

// 另外还有一个 Set，用于标识正在初始化中的 bean 名称
Set<String> singletonsCurrentlyInCreation = Collections.newSetFromMap(new ConcurrentHashMap<>(16));
```

再看上面的场景中，a、b 的构造与注入的过程：

```txt
A 构造方法实例化得到实例 a
a 保存到三级缓存中
a 开始自动装配，期望注入 b
  先从单例池(即一级缓存)中获取 b，不存在
  再从 set 判断 b 是否正在初始化【否】
  初始化 b
    B 构造方法实例化得到 b
    先从单例池(即一级缓存)中获取 a，不存在
    再从 set 判断 a 是否正在初始化【是】
      (由此可断定发生了循环依赖)
    尝试从二级缓存中获取，不存在
    从三级缓存中拿到 a 及 lambda，执行之，返回对象 a
      (若 A 需要增强，则返回代理对象 a' 代替 a)
    a/a' 保存到二级缓存中
    b 中注入 a/a' 完成
    (假设后续有 c 期望注入 a/a'，且 a 仍未初始化完成，则直接可以从二级缓存拿到，保证了单例)
  b 初始化完成，添加到单例池
a 注入 b 完成
a 进行后续初始化工作
a 初始化完成，a/a' 被添加到单例池
  (注意进行初始化的始终是 a，如果 A 需要增强，则最终添加到单例池的是 a')
a 从 singletonsCurrentlyInCreation 这个 set 中删除
```

相关代码逻辑在 `AbstractAutowireCapableBeanFactory` 和 `DefaultSingletonBeanRegistry` 中。

AbstractAutowireCapableBeanFactory.doCreateBean() 方法：  
其中在自动注入，执行 populateBean() 时，调用了 DefaultSingletonBeanRegistry.getSingleton()

```java
// doCreateBean() 节选
// 如果是单例，且允许循环依赖，且 bean 正在创建中(基本都是 true)
boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences && isSingletonCurrentlyInCreation(beanName));  
if (earlySingletonExposure) {  
   if (logger.isTraceEnabled()) {  
      logger.trace("Eagerly caching bean '" + beanName +  
            "' to allow for resolving potential circular references");  
   }  
   // 加入到三级缓存，value 是一个 lambda，
   // 本质是一个匿名内部类对象，重写了 ObjectFactory 的 getObject() 方法
   addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));  
}
```

```java
// DefaultSingletonBeanRegistry.getSingleton()
protected Object getSingleton(String beanName, boolean allowEarlyReference) {
		// 从一级缓存拿
		Object singletonObject = this.singletonObjects.get(beanName);
		// 未命中，且正在初始化
		if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
  		// 从二级缓存拿
			singletonObject = this.earlySingletonObjects.get(beanName);
			// 未命中
			if (singletonObject == null && allowEarlyReference) {
				synchronized (this.singletonObjects) {
					// 双重检测
					singletonObject = this.singletonObjects.get(beanName);
					if (singletonObject == null) {
						singletonObject = this.earlySingletonObjects.get(beanName);
						if (singletonObject == null) {
						  // 从三级缓存拿
							ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
							if (singletonFactory != null) {
							  // 命中，执行三级缓存中保存的 lambda，得到对象
							  // 可能是提前创建的代理对象，也可能是普通对象
								singletonObject = singletonFactory.getObject();
								// 保存到二级缓存
								this.earlySingletonObjects.put(beanName, singletonObject);
								// 从三级缓存删除，保证单例性
								this.singletonFactories.remove(beanName);
							}
						}
					}
				}
			}
		}
		return singletonObject;
	}
```

### 为什么

- **问题 A**：自动装配时，如何打破循环依赖？

接上面的场景，即先将构造完成的 a 保存到一个 map 中，当 b 注入 a 断定发生循环依赖时，判断 map 中是否已经有 a，若有则直接将其注入到 b 中即可，避免陷入循环。这个 map 其实就是第三级缓存 singletonFactories。

第三级缓存 value 保存的是一个对象，需要回调其方法，返回一个 bean，保存到第二级缓存中。返回的这个对象可能是普通对象，也可能是增强后的代理对象。

- **问题 B**：如何判断是否发生了循环依赖呢？

可以在 a 初始化前，将其 name 添加进一个 Set 中 (即上面提到的 singletonsCurrentlyInCreation)，标识 a 正处于生命周期的初始化过程中，当 b 准备注入 a 时，发现 a 存在于 Set，即可断定发生了循环依赖，这时就去第二、三级缓存中尝试获取 a 进行注入。

第三级缓存一定是有 a 的，这时，b 注入 a 成功，接着进行其他生命周期初始化操作，最后 b 初始化完成，被保存到单例池即一级缓存中，接着 a 可以成功注入 b。

可以发现，使用一个 map 就能打破循环了，为什么还分了第二、三级缓存这两级呢，其实是为了解决 AOP 的问题，接着看下面的问题。

- **问题 C**：AOP 时可能会创建并注入动态代理对象。  

例如我们期望对 A 进行增强，那么 b 中持有的 A 的实例 a，就应该是 a 的代理对象。而普通情况下 (未发生循环依赖) 的代理对象是在生命周期的“初始化后” postProcessAfterInitialization() 中进行创建的，显然对于存在循环依赖的 a、b 来说这是不合适的，因为按照上面使用一个 map 解决循环的逻辑，b 中持有的将是 A 实例的普通对象，而不是代理对象，因为此时 a 的生命周期还处于“自动装配”阶段，代理对象还没创建。  

为了解决这个问题，对于有循环依赖的情形，就需要 **提前创建代理对象**，当 b 注入 a 的过程中，断定发生了循环依赖，且 a 需要被增强时，就创建 a 的代理对象 a'。代理对象 a' 将持有 a 的引用，最终 a' 将代替 a 注入到 b 、并保存到二级缓存中，直到最后被添加到单例池。

提前创建代理对象的操作就是在第三级缓存保存的对象，回调其方法时返回的。

**问题 C1**：那么什么时候将提前创建的代理对象 a’ 添加到单例池？  

由于代理对象 a' 需要持有 A 的实例 a，但此时 (提前创建出代理对象后) a 仍处于未完成生命周期初始化操作的状态 (正处于自动装配中)，所以此时代理对象 a' 还不能被添加到单例池。  

(后面再回答“问题 C1”)

**问题 C2**：又假设 a 除了要注入 b，还要注入 C 的实例，而 C 和 B 一样，成员属性中也循环依赖了 A 的实例，如下所示：

```java
class A {
    B b;
    C c;
}
class B {
    A a;  // 应当注入代理对象 a'
}
class C {
    A a;  // 应当注入代理对象 a'
}
```

那么当 b 的初始化完成 (添加进了单例池)，a 注入 b 也完成，将要注入 C 的实例 c 时，发生了和 a 注入 b 一样的过程，c 注入 a 时判断遇到了循环依赖，但由于此时代理对象 a' 还没有添加到单例池，对 c 不可见，那么 c 将会重复 b 的步骤，企图提前创建 a 的代理对象并进行注入，那么 b 和 c 持有的代理对象 a' 将不是同一个对象。

可以在判断发生循环依赖后，先尝试从二级缓存中获取待注入的对象，如果没有获取到，那么创建出动态代理对象后，将其保存到二级缓存中。  
接上面的场景，例如 b 注入对象 a 时，先尝试从二级缓存获取失败后，从三级缓存拿到 lambda 方法，执行之创建动态代理对象 a' 并保存到二级缓存，当 c 注入 a 时，就能直接从二级缓存拿到代理对象 a' 并注入，保证了 A 的单例性。

这时就可以回答“问题 C1”，由于提前创建了代理对象，那么在后置处理器 postProcessAfterInitialization() 中就不能再重复创建了，而是应该直接返回代理对象，然后像对待普通 bean 一样将 a' 添加到单例池。

### Debug Demo

#todo debug 有无动态代理的两种情况，验证这个过程

## 容器初始化过程

[44_尚硅谷_[源码]-Spring容器创建-BeanFactory预准备_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1gW411W7wy?p=44&vd_source=009e48c9eac896fdd5399a398c31a382)

- 通过注解方式创建 IoC 容器，构造方法

```java
public AnnotationConfigApplicationContext(Class<?>... componentClasses) {
    this();
    register(componentClasses);
    refresh(); // 重点关注：容器创建与刷新
}
```

- `refresh()`

```java
public void refresh() throws BeansException, IllegalStateException {
		synchronized (this.startupShutdownMonitor) {
			StartupStep contextRefresh = this.applicationStartup.start("spring.context.refresh");
			// 准备环境
			prepareRefresh();
			// 初始化配置 BeanFactory
			ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();
			prepareBeanFactory(beanFactory);
			try {
				// 回调，供子类自定义设置 BeanFactory
				postProcessBeanFactory(beanFactory);
				StartupStep beanPostProcess = this.applicationStartup.start("spring.context.beans.post-process");
				// 执行已注册的 BeanFactory 后置处理器
				// 先执行 BeanDefinitionRegistryPostProcessor
				// 再执行 BeanFactoryPostProcessor
				invokeBeanFactoryPostProcessors(beanFactory);
				// 注册 Bean 后置处理器(未执行)
				registerBeanPostProcessors(beanFactory);
				beanPostProcess.end();
				// 初始化 MessageSource，干啥的？
				initMessageSource();
				// 初始化事件派发器
				initApplicationEventMulticaster();
				// 回调，供子类自定义容器刷新的逻辑
				onRefresh();
				// 将容器中所有 Listener，注册到派发器中
				// 并且派发 prepareRefresh() 中的 earlyEvent
				registerListeners();
				// 初始化其余所有非懒加载的单例 bean，重点关注
				finishBeanFactoryInitialization(beanFactory);
				// 发布事件
				finishRefresh();
			}
			catch (BeansException ex) {
				if (logger.isWarnEnabled()) {
					logger.warn("Exception encountered during context initialization - " +
							"cancelling refresh attempt: " + ex);
				}
				// Destroy already created singletons to avoid dangling resources.
				destroyBeans();
				// Reset 'active' flag.
				cancelRefresh(ex);
				// Propagate exception to caller.
				throw ex;
			}
			finally {
				// Reset common introspection caches in Spring's core, since we
				// might not ever need metadata for singleton beans anymore...
				resetCommonCaches();
				contextRefresh.end();
			}
		}
	}
```

- 初始化其余所有非懒加载的单例 bean：`finishBeanFactoryInitialization(beanFactory)` 中调用 `preInstantiateSingletons()`，

```java
public void preInstantiateSingletons() throws BeansException {
  if (logger.isTraceEnabled()) {
    logger.trace("Pre-instantiating singletons in " + this);
  }

  // 拿到所有 BeanDenifinition
  List<String> beanNames = new ArrayList<>(this.beanDefinitionNames);

  // 遍历创建 bean
  for (String beanName : beanNames) {
    RootBeanDefinition bd = getMergedLocalBeanDefinition(beanName);
    // 如果非抽象、单实例、非懒加载
    if (!bd.isAbstract() && bd.isSingleton() && !bd.isLazyInit()) {
      // 若是工厂 Bean，调用工厂方法
      if (isFactoryBean(beanName)) {
        Object bean = getBean(FACTORY_BEAN_PREFIX + beanName);
        if (bean instanceof FactoryBean) {
          FactoryBean<?> factory = (FactoryBean<?>) bean;
          boolean isEagerInit;
          if (System.getSecurityManager() != null && factory instanceof SmartFactoryBean) {
            isEagerInit = AccessController.doPrivileged(
                (PrivilegedAction<Boolean>) ((SmartFactoryBean<?>) factory)::isEagerInit,
                getAccessControlContext());
          }
          else {
            isEagerInit = (factory instanceof SmartFactoryBean &&
                ((SmartFactoryBean<?>) factory).isEagerInit());
          }
          if (isEagerInit) {
            getBean(beanName);
          }
        }
      }
      // 如果是普通 bean，调用 getBean 方法，内部调用了 doGetBean 方法
      else {
        getBean(beanName);
      }
    }
  }

  // 所有的创建完成后
  for (String beanName : beanNames) {
    Object singletonInstance = getSingleton(beanName);
    // 执行 SmartInitializingSingleton 后置处理
    if (singletonInstance instanceof SmartInitializingSingleton) {
      StartupStep smartInitialize = this.getApplicationStartup().start("spring.beans.smart-initialize")
          .tag("beanName", beanName);
      SmartInitializingSingleton smartSingleton = (SmartInitializingSingleton) singletonInstance;
      if (System.getSecurityManager() != null) {
        AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
          // 执行回调
          smartSingleton.afterSingletonsInstantiated();
          return null;
        }, getAccessControlContext());
      }
      else {
        smartSingleton.afterSingletonsInstantiated();
      }
      smartInitialize.end();
    }
  }
}
```

- `doGetBean(beanName)`：

```java
protected <T> T doGetBean(
    String name, @Nullable Class<T> requiredType, @Nullable Object[] args, boolean typeCheckOnly)
    throws BeansException {

  String beanName = transformedBeanName(name);
  Object beanInstance;

  // 先尝试从单例池(一级缓存)拿
  Object sharedInstance = getSingleton(beanName);
  if (sharedInstance != null && args == null) {
    if (logger.isTraceEnabled()) {
      // 如果这个 bean 正在创建中，则可能发生了循环依赖
      if (isSingletonCurrentlyInCreation(beanName)) {
        logger.trace("Returning eagerly cached instance of singleton bean '" + beanName +
            "' that is not fully initialized yet - a consequence of a circular reference");
      }
      else {
        logger.trace("Returning cached instance of singleton bean '" + beanName + "'");
      }
    }
    beanInstance = getObjectForBeanInstance(sharedInstance, name, beanName, null);
  }

  else {
    // 判断是否正在创建中，避免重复创建
    if (isPrototypeCurrentlyInCreation(beanName)) {
      throw new BeanCurrentlyInCreationException(beanName);
    }

    // 获取父Bean工厂，集成MVC时，存在父子容器，可能用到
    BeanFactory parentBeanFactory = getParentBeanFactory();
    if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
      // Not found -> check parent.
      String nameToLookup = originalBeanName(name);
      if (parentBeanFactory instanceof AbstractBeanFactory) {
        return ((AbstractBeanFactory) parentBeanFactory).doGetBean(
            nameToLookup, requiredType, args, typeCheckOnly);
      }
      else if (args != null) {
        // Delegation to parent with explicit args.
        return (T) parentBeanFactory.getBean(nameToLookup, args);
      }
      else if (requiredType != null) {
        // No args -> delegate to standard getBean method.
        return parentBeanFactory.getBean(nameToLookup, requiredType);
      }
      else {
        return (T) parentBeanFactory.getBean(nameToLookup);
      }
    }

    // 方法注释说 typeCheckOnly 参数目前没用
    if (!typeCheckOnly) {
      // 标记 bean 已被或将要被创建
      markBeanAsCreated(beanName);
    }

    StartupStep beanCreation = this.applicationStartup.start("spring.beans.instantiate")
        .tag("beanName", name);
    try {
      if (requiredType != null) {
        beanCreation.tag("beanType", requiredType::toString);
      }
      // 拿到 bean 定义
      RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
      checkMergedBeanDefinition(mbd, beanName, args);

      // 拿到依赖的 bean
      String[] dependsOn = mbd.getDependsOn();
      if (dependsOn != null) {
        for (String dep : dependsOn) {
          if (isDependent(beanName, dep)) {
            throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                "Circular depends-on relationship between '" + beanName + "' and '" + dep + "'");
          }
          registerDependentBean(dep, beanName);
          try {
            // 先创建依赖的 bean
            getBean(dep);
          }
          catch (NoSuchBeanDefinitionException ex) {
            throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                "'" + beanName + "' depends on missing bean '" + dep + "'", ex);
          }
        }
      }

      // 如果是单例
      if (mbd.isSingleton()) {
        // lambda 是 ObjectFactory 接口的 getObject 方法
        sharedInstance = getSingleton(beanName, () -> {
          try {
            // 创建 bean，重点关注
            return createBean(beanName, mbd, args);
          }
          catch (BeansException ex) {
            // Explicitly remove instance from singleton cache: It might have been put there
            // eagerly by the creation process, to allow for circular reference resolution.
            // Also remove any beans that received a temporary reference to the bean.
            destroySingleton(beanName);
            throw ex;
          }
        });
        beanInstance = getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
      }

      // 如果是多例
      else if (mbd.isPrototype()) {
        // It's a prototype -> create a new instance.
        Object prototypeInstance = null;
        try {
          beforePrototypeCreation(beanName);
          prototypeInstance = createBean(beanName, mbd, args);
        }
        finally {
          afterPrototypeCreation(beanName);
        }
        beanInstance = getObjectForBeanInstance(prototypeInstance, name, beanName, mbd);
      }

      else {
        String scopeName = mbd.getScope();
        if (!StringUtils.hasLength(scopeName)) {
          throw new IllegalStateException("No scope name defined for bean '" + beanName + "'");
        }
        Scope scope = this.scopes.get(scopeName);
        if (scope == null) {
          throw new IllegalStateException("No Scope registered for scope name '" + scopeName + "'");
        }
        try {
          Object scopedInstance = scope.get(beanName, () -> {
            beforePrototypeCreation(beanName);
            try {
              return createBean(beanName, mbd, args);
            }
            finally {
              afterPrototypeCreation(beanName);
            }
          });
          beanInstance = getObjectForBeanInstance(scopedInstance, name, beanName, mbd);
        }
        catch (IllegalStateException ex) {
          throw new ScopeNotActiveException(beanName, scopeName, ex);
        }
      }
    }
    catch (BeansException ex) {
      beanCreation.tag("exception", ex.getClass().toString());
      beanCreation.tag("message", String.valueOf(ex.getMessage()));
      cleanupAfterBeanCreationFailure(beanName);
      throw ex;
    }
    finally {
      beanCreation.end();
    }
  }

  return adaptBeanInstance(name, beanInstance, requiredType);
}
```

- `createBean(beanName, mbd, args)`：

```java
protected Object createBean(String beanName, RootBeanDefinition mbd, @Nullable Object[] args)
    throws BeanCreationException {

  if (logger.isTraceEnabled()) {
    logger.trace("Creating instance of bean '" + beanName + "'");
  }
  RootBeanDefinition mbdToUse = mbd;

  // Make sure bean class is actually resolved at this point, and
  // clone the bean definition in case of a dynamically resolved Class
  // which cannot be stored in the shared merged bean definition.
  Class<?> resolvedClass = resolveBeanClass(mbd, beanName);
  if (resolvedClass != null && !mbd.hasBeanClass() && mbd.getBeanClassName() != null) {
    mbdToUse = new RootBeanDefinition(mbd);
    mbdToUse.setBeanClass(resolvedClass);
  }

  // Prepare method overrides.
  try {
    mbdToUse.prepareMethodOverrides();
  }
  catch (BeanDefinitionValidationException ex) {
    throw new BeanDefinitionStoreException(mbdToUse.getResourceDescription(),
        beanName, "Validation of method overrides failed", ex);
  }

  try {
    // InstantiationAwareBeanPostProcessor 执行，可能创建代理对象
    Object bean = resolveBeforeInstantiation(beanName, mbdToUse);
    if (bean != null) {
      return bean;
    }
  }
  catch (Throwable ex) {
    throw new BeanCreationException(mbdToUse.getResourceDescription(), beanName,
        "BeanPostProcessor before instantiation of bean failed", ex);
  }

  try {
    // 如果上一步没有返回代理对象，重点关注
    Object beanInstance = doCreateBean(beanName, mbdToUse, args);
    if (logger.isTraceEnabled()) {
      logger.trace("Finished creating instance of bean '" + beanName + "'");
    }
    return beanInstance;
  }
  catch (BeanCreationException | ImplicitlyAppearedSingletonException ex) {
    // A previously detected exception with proper bean creation context already,
    // or illegal singleton state to be communicated up to DefaultSingletonBeanRegistry.
    throw ex;
  }
  catch (Throwable ex) {
    throw new BeanCreationException(
        mbdToUse.getResourceDescription(), beanName, "Unexpected exception during bean creation", ex);
  }
}
```

- `doCreateBean(beanName, mbdToUse, args)`：

```java
protected Object doCreateBean(String beanName, RootBeanDefinition mbd, @Nullable Object[] args)
    throws BeanCreationException {

  BeanWrapper instanceWrapper = null;
  if (mbd.isSingleton()) {
    instanceWrapper = this.factoryBeanInstanceCache.remove(beanName);
  }
  if (instanceWrapper == null) {
    // 实例化 bean，通过工厂、构造器...
    instanceWrapper = createBeanInstance(beanName, mbd, args);
  }
  Object bean = instanceWrapper.getWrappedInstance();
  Class<?> beanType = instanceWrapper.getWrappedClass();
  if (beanType != NullBean.class) {
    mbd.resolvedTargetType = beanType;
  }

  // 后置处理器 MergedBeanDefinitionPostProcessor 执行
  synchronized (mbd.postProcessingLock) {
    if (!mbd.postProcessed) {
      try {
        applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName);
      }
      catch (Throwable ex) {
        throw new BeanCreationException(mbd.getResourceDescription(), beanName,
            "Post-processing of merged bean definition failed", ex);
      }
      mbd.postProcessed = true;
    }
  }

  // Eagerly cache singletons to be able to resolve circular references
  // even when triggered by lifecycle interfaces like BeanFactoryAware.
  boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
      isSingletonCurrentlyInCreation(beanName));
  if (earlySingletonExposure) {
    if (logger.isTraceEnabled()) {
      logger.trace("Eagerly caching bean '" + beanName +
          "' to allow for resolving potential circular references");
    }
    // 添加到三级缓存
    addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
  }

  // Initialize the bean instance.
  Object exposedObject = bean;
  try {
    // 给实例注入属性，重点关注
    populateBean(beanName, mbd, instanceWrapper);
    // bean 初始化，执行 aware、后置处理器、init 方法等，注册销毁方法
    exposedObject = initializeBean(beanName, exposedObject, mbd);
  }
  catch (Throwable ex) {
    if (ex instanceof BeanCreationException && beanName.equals(((BeanCreationException) ex).getBeanName())) {
      throw (BeanCreationException) ex;
    }
    else {
      throw new BeanCreationException(
          mbd.getResourceDescription(), beanName, "Initialization of bean failed", ex);
    }
  }

  if (earlySingletonExposure) {
    Object earlySingletonReference = getSingleton(beanName, false);
    if (earlySingletonReference != null) {
      if (exposedObject == bean) {
        exposedObject = earlySingletonReference;
      }
      else if (!this.allowRawInjectionDespiteWrapping && hasDependentBean(beanName)) {
        String[] dependentBeans = getDependentBeans(beanName);
        Set<String> actualDependentBeans = new LinkedHashSet<>(dependentBeans.length);
        for (String dependentBean : dependentBeans) {
          if (!removeSingletonIfCreatedForTypeCheckOnly(dependentBean)) {
            actualDependentBeans.add(dependentBean);
          }
        }
        if (!actualDependentBeans.isEmpty()) {
          throw new BeanCurrentlyInCreationException(beanName,
              "Bean with name '" + beanName + "' has been injected into other beans [" +
              StringUtils.collectionToCommaDelimitedString(actualDependentBeans) +
              "] in its raw version as part of a circular reference, but has eventually been " +
              "wrapped. This means that said other beans do not use the final version of the " +
              "bean. This is often the result of over-eager type matching - consider using " +
              "'getBeanNamesForType' with the 'allowEagerInit' flag turned off, for example.");
        }
      }
    }
  }

  // Register bean as disposable.
  try {
    registerDisposableBeanIfNecessary(beanName, bean, mbd);
  }
  catch (BeanDefinitionValidationException ex) {
    throw new BeanCreationException(
        mbd.getResourceDescription(), beanName, "Invalid destruction signature", ex);
  }

  return exposedObject;
}
```

- `populateBean(beanName, mbd, instanceWrapper)`：

```java
protected void populateBean(String beanName, RootBeanDefinition mbd, @Nullable BeanWrapper bw) {  
 if (bw == null) {  
    if (mbd.hasPropertyValues()) {  
       throw new BeanCreationException(  
             mbd.getResourceDescription(), beanName, "Cannot apply property values to null instance");  
    }  
    else {  
       // Skip property population phase for null instance.  
       return;  
    }  
 }  

// InstantiationAwareBeanPostProcessor 执行 after
 if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {  
    for (InstantiationAwareBeanPostProcessor bp : getBeanPostProcessorCache().instantiationAware) {  
       if (!bp.postProcessAfterInstantiation(bw.getWrappedInstance(), beanName)) {  
          return;  
       }  
    }  
 }  

 PropertyValues pvs = (mbd.hasPropertyValues() ? mbd.getPropertyValues() : null);  

 int resolvedAutowireMode = mbd.getResolvedAutowireMode();  
 if (resolvedAutowireMode == AUTOWIRE_BY_NAME || resolvedAutowireMode == AUTOWIRE_BY_TYPE) {  
    MutablePropertyValues newPvs = new MutablePropertyValues(pvs);  
    // Add property values based on autowire by name if applicable.  
    if (resolvedAutowireMode == AUTOWIRE_BY_NAME) {  
       autowireByName(beanName, mbd, bw, newPvs);  
    }  
    // Add property values based on autowire by type if applicable.  
    if (resolvedAutowireMode == AUTOWIRE_BY_TYPE) {  
       autowireByType(beanName, mbd, bw, newPvs);  
    }  
    pvs = newPvs;  
 }  

 boolean hasInstAwareBpps = hasInstantiationAwareBeanPostProcessors();  
 boolean needsDepCheck = (mbd.getDependencyCheck() != AbstractBeanDefinition.DEPENDENCY_CHECK_NONE);  

 PropertyDescriptor[] filteredPds = null;  
 if (hasInstAwareBpps) {  
    if (pvs == null) {  
       pvs = mbd.getPropertyValues();  
    }  
    // InstantiationAwareBeanPostProcessor 执行 postProcessProperties()
    for (InstantiationAwareBeanPostProcessor bp : getBeanPostProcessorCache().instantiationAware) {  
       PropertyValues pvsToUse = bp.postProcessProperties(pvs, bw.getWrappedInstance(), beanName);  
       if (pvsToUse == null) {  
          if (filteredPds == null) {  
             filteredPds = filterPropertyDescriptorsForDependencyCheck(bw, mbd.allowCaching);  
          }  
          pvsToUse = bp.postProcessPropertyValues(pvs, filteredPds, bw.getWrappedInstance(), beanName);  
          if (pvsToUse == null) {  
             return;  
          }  
       }  
       pvs = pvsToUse;  
    }  
 }  
 if (needsDepCheck) {  
    if (filteredPds == null) {  
       filteredPds = filterPropertyDescriptorsForDependencyCheck(bw, mbd.allowCaching);  
    }  
    checkDependencies(beanName, mbd, filteredPds, pvs);  
 }  

 if (pvs != null) {
    // 利用 setter 反射赋值  
    applyPropertyValues(beanName, mbd, bw, pvs);  
 }  
}
```

后置处理器都可以通过实现 PriorityOrdered 与 Ordered 接口实现排序，注册时会先注册 PriorityOrdered 再注册 Ordered，最后注册默认排序的。  
Bean 的后置处理器 BeanPostProcessor，其子类的执行时机有所不同。

## AOP 原理

`@EnableAspectJAutoProxy`，利用 @Import 传递 ImportBeanDefinitionRegistrar 的实现类 AspectJAutoProxyRegistrar ，向容器中注册了自动代理的创建器组件 AnnotationAwareAspectJAutoProxyCreator(name 为 internalAutoProxoyCreator)。

找到 `AnnotationAwareAspectJAutoProxyCreator` 的层层父类，发现最上层的父类 AbstractAutoProxyCreator 实现了 SmartInstantiationAwareBeanPostProcessor 和 BeanFactoryAware 两个接口。  
![[_resources/attachment/56af1d3a-24f1-46d1-8eab-5b9981c7b302.png]]

#todo debug 源码

结论：AnnotationAwareAspectJAutoProxyCreator 实现的 InstantiationAwareBeanPostProcessor 不同于其他 BeanPostProocessor 会在 bean 执行 init-method 前后调用，而是在任何 bean 创建之前就会调用，尝试创建该 bean 的代理对象，注册到容器。

#todo 几个增强的链式调用逻辑

### 声明式事务原理
