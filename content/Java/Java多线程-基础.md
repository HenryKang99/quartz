---
title: 'Java多线程-基础'
categories: []
description: ''
order: 0
date: 2023-01
---

## Java 多线程

### 概念

**多线程**：一个程序同时执行多个任务，通常每一个任务称为一个线程（thread），可以同时运行一个以上线程的程序称为多线程程序（multi-threaded) 。

**进程**：进程是操作系统资源分配的基本单位，是程序的一次执行过程。进程间隔离性强，较安全但是进程间通信效率低。

**线程**：线程是 CPU 进行调度的基本单位，是进程内的一个执行单元。进程间可以共享内存，便于通信但是伴随着风险，同时线程调度也要耗费一定资源。

运行一个 Java 程序，开启一个 JVM 就是一个进程，这个进程包含 main 线程和 GC 线程等，另外还有一些守护线程，当一个 Java 程序中只剩下守护线程时，JVM 就会退出。

### OS 线程的实现方式

实现线程的方式可以分为：用户级线程、内核级线程、混合线程。

**用户级线程 (1:N)**：在用户空间实现，对外不可见，内核只能看到一个进程。由进程自己维护线程的调度，优点是避免了像内核级线程调度一样陷入内核态引起的上下文切换；缺点是实现复杂，且无法发挥多核 CPU 的优势，该进程只能得到一个 CPU 核心，并且当某一线程进行系统调用时，该进程都会被阻塞，其他能执行的线程也将无法执行。

**内核级线程 (1:1)**：内核负责线程调度，将各线程映射到处理器上，优点是在多核 CPU 中可以并行执行，缺点是和用户级线程相比花费开销较大。

**混合线程 (M:N)**：在每个内核线程（又称为轻量级进程）中又实现了用户级线程（又称为协程、纤程）。

**注意：** Java 中的线程是映射到 OS 中的内核级线程。

### 线程状态

![](_resources/attachment/9c61187b-0eed-48b1-929d-e58bf90e2258.png)

1. New 新创建：即 new Thread(r) 后还没有调用 start 方法时，线程还没有开始运行；
2. Runnable 可运行：线程处在随时可以运行的状态，但可能在运行也可能没有运行，取决于是否得到了时间片；
3. Blocked 被阻塞 ；
4. Waiting 等待；
5. Timed Waiting 计时等待；
6. Terminated 被终止：run 方法正常结束，或因为一个没有捕获的异常导致 run 方法终止，则线程死亡，异常终止后会自动释放持有的锁。

当线程处于被阻塞或等待状态时，它暂时不活动 ，它不运行任何代码且消耗最少的资源，直到线程调度器重新激活它。

当一个线程试图获得另一个线程持有的锁时，进入 **阻塞**；

当线程等待另一个线程通知调度器一个 **条件** 时（线程通信），进入 **等待**；

当调用了 `Thread.sleep`、`Object.wait`、`Thread.join`、`Lock.tryLock` 以及 `Condition.await` 并添加时间参数时进入 **计时等待**；

### 线程属性

1. 优先级：Java 中使用 `setPriority` 方法设置线程优先级在 [1,10] 之间越来越高，默认为 5；

   - 线程优先级高度依赖于宿主机系统的实现，即 Java 将优先级映射到宿主机的线程实现机制上，例如 Windows 有 7 个优先级，Oracle 为 Linux 提供的 JVM 中没有线程优先级；
   - 若高优先级的线程没有进入非活动状态，那么低优先级的线程可能会饿死；

2. 守护线程：在线程 **启动之前** 调用 `thread.setDaemon(true)` 声明该线程为守护线程，守护线程唯一的作用是为其他线程提供服务，例如计时线程；

### 线程的创建

一般有这几种方法：

1. 继承 Thread 类或实现 Runnable 接口，重写其 run 方法。
2. 关于 callable 接口，一般与线程池连用。

注意：启动线程需要调用 start() 方法，如果直接调用 run() 方法，那么会被当做普通方法执行。

```java
public class Test00CreateThread {
    static class MyThread extends Thread {
        public MyThread(String name) {
            super(name);
        }

        @Override
        public void run() {
            System.out.println(Thread.currentThread().getName());
        }
    }

    @Test
    public void m() throws ExecutionException, InterruptedException {
        // Thread
        new MyThread("thread").start();

        // Runnable
        new Thread(() -> {
            System.out.println(Thread.currentThread().getName());
        }, "runnable").start();

        // Callable
        FutureTask<Object> objectFutureTask = new FutureTask<>(() -> {
            System.out.println(Thread.currentThread().getName());
            return Thread.currentThread().getName();
        });
        new Thread(objectFutureTask, "callable").start();
        System.out.println("get:" + objectFutureTask.get());
    }
}
```

## 几个基础的同步方法

### synchronized

**原理**：基于“管程”(Monitor) 实现，管程是由 OS 提供的基于信号量的高级同步原语，目的是方便编程，由 OS 负责加锁、释放锁。

**使用**：可以加在代码块、方法声明上；锁方法时，对于普通方法，锁是 this；对于 static 方法，锁是该类的 class 对象。

**注意**：要使用同一个 Runnable 的实例 target 去创建多线程，才能使多线程锁到同一个对象上。不要锁不可变类如 String、包装类。

**锁优化**：synchronized 基于 OS 信号量实现，加锁解锁需要进行系统调用陷入内核态，进行上下文切换，属于重量级锁。JDK 1.6 时对其进行了优化，加入了锁升级的过程，自旋 --> 偏向锁 --> 轻量级锁 -->重量级锁，前三个阶段都使用到了 CAS 操作，相当于无锁。锁的降级条件比较苛刻，可以理解为无法降级。

### volatile

**作用**：用于声明禁用缓存和指令重排序，**只能保证有序性和可见性，无法保证原子性**。

**原理**：内存屏障。

### Thread.sleep(ms)

- 只会让出 CPU 时间片，不会释放其他任何资源（如持有的锁），可以指定时间，时间过后进入就绪态，重新参与时间片竞争。`sleep(0)` 可以看成一个运行态的进程产生一个中断，由运行态直接转入就绪态。

### Thread.yield()

- 将当前线程由运行态转换为就绪态，重新参与时间片竞争，与 `sleep(0)` 效果相似，同样不会释放锁资源。

### wait() & notify()

**必须在同步块中调用**，在同步块 `synchronized(lock){ }` 中调用 `lock.wait()` 会使当前线程 **释放目标对象的锁并进入到 lock 的等待队列**，当调用 `lock.notify()` 时，在队列中随机选择一个唤醒，因此是不公平的。`lock.notifyAll()` 会唤醒所有等待在 lock 上的线程。

wait 与 notify 顺序不能颠倒，否则可能会一直阻塞。

> [!note] sleep、yield、wait、notify 是否会释放锁？  
> 当前线程调用 Thread 的静态方法 sleep、yield 不会释放当前持有的锁，而 wait 和 notify 通过 synchronized(lock) 中声明的锁 lock 调用，会释放该锁。

### join(ms)

- join 方法本质是 **让调用线程 wait 在当前被等待线程的实例对象上**，被等待线程退出之前会调用 notifyAll() 方法唤醒所有等待在自己身上的线程。
- 可以传一个毫秒值作为参数，超时后会自动取消等待，继续往下执行。

```java
public static void main(String[] args){ 
	try {
		Thread t1 = new Thread(); 
		t1.start();
		t1.join(); 
		// main线程会等待t1执行完后再执行，即main线程wait在t1对象上。
	} catch (InterruptedException e) {
	}
} 
```

### ReentrantLock

当一个线程已经持有某个锁，并再次尝试获取该锁时，若被阻塞，称为 **不可重入**，若可以获得，则称为 **可重入**。下面是使用 synchronized(可重入) 模拟不可重入锁的例子。

```java
public class Lock{
    private boolean isLocked = false;
	// 加锁
    public synchronized void lock() throws InterruptedException{
		// 如果已经获取锁了，则阻塞。
        while(isLocked){    
            wait();
        }
        isLocked = true;
    }
	// 释放锁
    public synchronized void unlock(){
        isLocked = false;
        notify();
    }
}

public class Count{
    Lock lock = new Lock();
    public void print(){
        lock.lock(); // 已经持有了lock
        doAdd();
        lock.unlock();
    }
    public void doAdd(){
        lock.lock(); // 此处阻塞
        //do something
        lock.unlock();
    }
}
```

synchronized 比较重，且阻塞时只能不停轮询，不能做其他事情，故而有 `ReentrantLock` 出现，ReentrantLock 可以使用 `tryLock()` **尝试获取锁**。

```java
private final Lock lock = new ReentrantLock();
// 尝试获取锁 1s 中，没有获取到的话，返回 false
if (lock.tryLock(1, TimeUnit.SECONDS)) {
    try {
		//do something
    } finally {
        lock.unlock();
    }
} else {
	//do something
}
```

Lock 与 await() + signal() 配合，作用同 Synchronized 与 wait() + notify() 相似。

### Semaphore

- 允许多个线程同时访问临界资源。

### stop()、resume()、suspend()

这三个方法都已被废弃。

- stop() 会强制停止一个线程，会导致不一致性。
- suspend() 用于挂起一个线程，resume() 用于唤醒，如果执行顺序发生改变，那么该线程将永远是挂起状态。

### interrupt

stop()、resume()、suspend() 被废弃，取而代之的是 interrupt()，当我们试图停止一个线程时，应该以中断的方式通知该线程，至于是停止还是继续运行，由该线程自己决定（通常线程执行完收尾工作后，停止自己）。

`public void interrupt()`

- Unless the current thread is interrupting itself, which is always permitted, the *checkAccess* method of this thread is invoked, which may cause a *SecurityException* to be thrown.
- If this thread is blocked in an invocation of the wait(), wait(long), or wait(long, int) methods of the Object class, or of the join(), join(long), join(long, int), sleep(long), or sleep(long, int), methods of this class, then its *interrupt status will be cleared* and it will receive an *InterruptedException*.
- If this thread is blocked in an I/O operation upon an InterruptibleChannel then the channel will be closed, the thread's interrupt status will be set, and the thread will receive a *ClosedByInterruptException*.
- If this thread is blocked in a Selector then the thread's interrupt status will be set and it will return immediately from the selection operation, possibly with a non-zero value, just as if the selector's wakeup method were invoked.
- If none of the previous conditions hold then this thread's interrupt status will be set.
- Interrupting a thread that is not alive need not have any effect.

**小结**：  
- 即只有该线程自己或其父线程，可以 interrupt 该线程，否则抛出 SecurityException。
- 当线程处于 wait、sleep、join ，即 **等待状态**，会被直接唤醒并转为就绪状态，如果能够得到运行，那么将抛出 InterruptedException，**此时 interrupt 标志位被置为 false**；
- 当线程处于 **被阻塞状态**，那么将置 interrupt 标志位为 true；
- 如果是 IO 阻塞，且 IO 通道可被中断，则抛出 ClosedByInterruptException；
- 如果阻塞在 select 操作上，则立即转变为就绪状态，就像执行了 wakeup 方法一样；
- 非上述情况，则将 interrupt 标志位为 true；
- 中断死的的线程，不会产生影响。

`public boolean isInterrupted()`  
返回 **是否被中断过** 的标志位，未处于活动状态的线程，其被忽略的线程中断，可通过此方法返回 true 来判断。

`public static boolean interrupted()`  
作用和 `isInterrupted()` 相同，区别在于每次调用后 **会将标志位置为 false**。

## CPU 中的锁

> 原子性、有序性、可见性，保证了这三条就不会出错。

### 原子性

单条指令可以完成的操作可以视为 **原子操作**，因为中断只能发生于指令间。在对临界资源进行访问时需要加锁，尤其是多核处理器中，还需要 **锁住总线**，屏蔽其他线程的访存操作。

**原语** 是由若干多机器指令构成的完成某种特定功能的一段程序，具有不可分割性。

### 有序性

CPU 会对指令进行重排序来提高性能，有时会产生意想不到的结果，这时就要使用到 **内存屏障**。内存屏障分为读屏障、写屏障、读写屏障三类，保证 **内存屏障后面的操作不会被重排序到屏障之前执行**。Volatile 的实现就使用到了内存屏障。

### 可见性

现代 CPU 拥有多级缓存，L1、L2 为每个 core 私有，L3 为 CPU 中所有 core 共享。为了保证 CPU 缓存的一致性，有很多的缓存一致性协议，Intel 使用的是 `MESI 协议`（`Modified Exclusive Shared Or Invalid`）。缓存一致性协议将锁内存的 **总线锁细化到缓存行锁**，大大提高了性能。

#### MESI

MESI 标志着缓存行的四种状态：

1. 被修改 **Modified**：当前缓存行是脏的。
   - 当其他 core 要读主存该部分数据时，该缓存行必须写回主存，状态转为 S。
2. 独享的 **Exclusive**：当前缓存行是当前 core 独占的，且是干净的。
   - 当其他 core 要进行相应读取时，状态转为 S；
   - 当进行修改操作后，状态转为 M。
3. 共享的 **Shared**：当前缓存行同时存在于多个 core 的缓存中。
   - 当其中一个 core 进行修改时，该 core 缓存行状态转为 M，其他缓存行状态转为 I。
   - 假设两个 core 对应缓存行状态为 S，其中一个将其作废，另一个仍是 S，并不会变为 E。
4. 失效的 **Invalid**：当前缓存行是无效的。

更详细的状态转换看 wiki 吧：[MESI 协议 wiki](https://zh.wikipedia.org/wiki/MESI%E5%8D%8F%E8%AE%AE)

#### 伪共享

[伪共享（false sharing），并发编程无声的性能杀手](https://www.cnblogs.com/cyfonly/p/5800758.html)

CPU 缓存中每 64 bit 称为一个 **缓存行**（cache line），是 CPU 对缓存进行读写的单位。

假设有两个 4 字节 int 类型 a、b 放在了同一缓存行，线程 A、B 同时分别对 a、b 进行读写操作，CPU 不会只读半字，而是将整个缓存行都读进来。这时就会发生 **伪共享**。A、B 对 a、b 的修改操作会导致整个缓存行都失效。

可以通过 padding 来防止伪共享，但需要注意的是 CPU 缓存是很昂贵的。
