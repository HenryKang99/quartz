---
title: 'Spring WebFlux'
description: ''
categories: []
tags: []
date: 2025-01
draft: false
---

## 响应式编程

响应式编程 (Reactive Programming) 是一种以**数据流**和**变化传递**为核心的编程模型，它以**事件驱动、异步、非阻塞**的处理数据的产生、流转与变化。核心是**被动响应**，即不主动轮询或等待数据状态的变化，而是在变化发生时执行预设的处理逻辑。

Java 9 引入了响应式流 (Reactive Streams) API，核心接口都定义在 `java.util.concurrent.Flow` 中，包括 `Publisher`、`Subscriber`、`Subscription` 和 `Processor`。

- 一个简单的例子：

```java
public class ReactiveStreamExample {

    public static void main(String[] args) throws Exception {
        // 创建发布者
        SubmissionPublisher<String> publisher = new SubmissionPublisher<>();

        // 创建订阅者
        Flow.Subscriber<String> subscriber = new Flow.Subscriber<>() {
            private Flow.Subscription subscription;

            @Override
            public void onSubscribe(Flow.Subscription subscription) {
                this.subscription = subscription;
                System.out.println("订阅成功");
                subscription.request(1); // 请求一个数据项
            }

            @Override
            public void onNext(String item) {
                System.out.println("接收到数据: " + item);
                subscription.request(1); // 继续请求下一个数据项
            }

            @Override
            public void onError(Throwable throwable) {
                System.err.println("发生错误: " + throwable.getMessage());
            }

            @Override
            public void onComplete() {
                System.out.println("数据处理完成");
            }
        };

        // 建立订阅关系
        publisher.subscribe(subscriber);

        // 发布数据，数据进入缓冲区
        publisher.submit("Hello");
        publisher.submit("Reactive");
        publisher.submit("Streams");

        // 关闭发布者，不再接受新的数据和订阅，消费者消费完成会触发 onComplete
        publisher.close();

        // 等待数据处理完成
        Thread.sleep(1000);
    }
}
```

- 添加一个 Processor：

```java
// 自定义 Processor：将字符串加上感叹号
class ExclamationProcessor extends SubmissionPublisher<String> implements Flow.Processor<String, String> {
    private Flow.Subscription subscription;

    @Override
    public void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        subscription.request(1); // 请求第一个数据项
    }

    @Override
    public void onNext(String item) {
        String transformed = item + "!";
        submit(transformed); // 发布该数据
        subscription.request(1); // 继续请求下一个数据项
    }

    @Override
    public void onError(Throwable throwable) {
        throwable.printStackTrace();
        closeExceptionally(throwable);
    }

    @Override
    public void onComplete() {
        close(); // 关闭 Processor
    }
}

// 建立数据流关系：Publisher → Processor → Subscriber
publisher.subscribe(processor);
processor.subscribe(subscriber);

```

- `SubmissionPublisher` 是 Java 9 提供的默认 `Publisher` 实现，默认使用 `ForkJoinPool.commonPool()` 作为执行器 (Executor)。
- `Subscriber` 接口定义了响应式处理的四个阶段：订阅、接收数据、错误处理、完成。
- `subscription.request(n)` 是**背压**机制的关键，控制订阅者一次请求多少数据。
- `Processor` 是一个既是 `Subscriber` 又是 `Publisher` 的组件，适合做数据转换、过滤等中间处理。

Publisher 缓冲数据并保存所有订阅关系，当特定事件发生时，异步执行 Subscriber 注册的回调方法。

发布者可以发出零或多个 `onNext` 信号，但必须且只能发出一个终止信号 `onError` 或 `onComplete`，终止信号发出之后，流就彻底结束了，不能再发出任何信号。

`SubmissionPublisher` **调用链路分析**：

- `Subscriber` 调用 `publisher.subscribe(this)`。
- `Publisher` 收到订阅请求，创建 `Subscription` 对象，它同时持有 `Publisher` 和 `Subscriber` 的引用。
- `Publisher` 异步调用 `subscriber.onSubscribe(subscription)`，将这个 `Subscription` 对象传递给 `Subscriber`。
- `Subscriber` 在 `onSubscribe` 方法里拿到 `Subscription` 对象后，调用 `subscription.request(n)`。
- `Publisher` 接收到 `request(n)` 信号后，会给该订阅者的**需求计数器** +n，如果有数据则异步调用 `subscriber.onNext(data)` 方法，如果没有数据，则在下次 `submit()` 方法执行产生数据时检查订阅者的需求，判断是否调用 `onNext`。
    - 需要注意，发布者会异步开启一个线程，在其中循环**同步调用** onNext，确保订阅者有序消费，直到满足需求或没有数据则退出循环释放线程资源，在下一次 request 或 submit 时再次触发。

> [!note] 理解事件驱动、异步、非阻塞  
> 事件驱动就是指当数据状态变化时收到通知，而这个通知的方式就是调用预先注册好的回调逻辑，而这个调用方式可以是同步的也可以是异步的，如果是异步的，则就实现了非阻塞。  
>
> 不管是发布者还是订阅者，都不会与特定的线程绑定。request、onXxx 等方法根据当前数据状态，互相异步调用，触发代码不断执行，不需要有线程阻塞等待。  
>
> 例如发布者在收到 request 信号后，若没有数据可供消费，也不会阻塞等待，而是记录需求退出方法归还线程资源，在下一次 submit 时再触发 onNext 逻辑。假设发布者是一个 http 请求，那就不会像同步编程一样，将当前线程阻塞在网络 I/O。

> [!question] 如果有多个订阅者，发布者会为每个订阅者维护独立的缓冲区吗？  
> 取决于发布者的类型：冷发布者 or 热发布者。
> - **冷发布者**：会为每个订阅者重播完整的数据序列，每当有一个新的订阅者进行订阅动作时，冷发布者会为这个订阅者重新执行一遍生产逻辑，每个订阅者都会得到一份完整的、独立的数据副本。
>     - 例如：`Flux.range(1, 5)`：每次订阅，都会重新生成 `1, 2, 3, 4, 5`。
> - **热发布者**：独立于订阅者而存在，订阅者只能接收到从它订阅那一刻起之后产生的新数据。带有重放功能的热发布者，可以缓冲一部分历史数据，当有新的订阅者到来时先消费这一部分数据。
>     - 例如：`Flux.interval(Duration.ofSeconds(1))`，每隔一秒产生一个数据，不论是否订阅。

## Reactor

[Reactor](https://projectreactor.io/docs) 是一个基于 Reactive Streams 规范，用于在 JVM 上构建非阻塞应用程序的**响应式库** (WebFlux、[R2DBC](https://r2dbc.io/) 等都使用它)。

Reactor 提供了两个可组合的响应式 APl 对象：`Flux` 对象表示 0..N 项的响应式序列，`Mono` 对象表示单个值或空结果。

下面看一个例子，引出一些概念：

```java
Flux.range(1, 10)
    .log()
    .filter(i -> i % 2 == 0)
    .map(i -> "hello: " + i)
    .subscribe(System.out::println);
```

`log()` 用于打印调试日志，`subscribe()` 是一个终结方法，用于触发流的执行。中间过程 (`filter`、`map`) 调用只是构建一个处理链，不执行终结方法则整个流不会执行，即没有订阅者，发布者不会发送任何数据。执行终结方法后，会从下游开始，逐层向上调用订阅方法，中间过程既是发布者也是订阅者。

### 创建流

#### just/range/fromIterable

- 通过 `just`、`range`、`fromIterable` 创建流：

```java
Flux.just("foo", "bar", "foobar").log().subscribe();

List<String> iterable = Arrays.asList("foo", "bar", "foobar");
Flux.fromIterable(iterable).log().subscribe();

// 从 1 开始生成 10 个数
Flux.range(1, 10).log().subscribe();

// Mono 的 API 是 Flux 的子集
Mono.empty().log().subscribe();
Mono.just("foo").log().subscribe();
```

#### generate

`generate` 用于**同步**、逐个的发送数据，可以调用 `SynchronousSink` 的 next、error、complete 方法，实现控制数据生成逻辑，需要注意 generate 中 <u>每次回调中 next() 最多只能调用一次</u>。

```java
// generate 全参方法如下：
public static <T, S> Flux<T> generate(
    Callable<S> stateSupplier, // 给生成器提供初始值 state
    BiFunction<S, SynchronousSink<T>, S> generator, // 生成器
    Consumer<? super S> stateConsumer // 生成结束或下游cancel时触发，消费最终的 state
);

// 举例：
Flux<String> flux = Flux.generate(
    () -> 0, // 初始值
    (state, sink) -> { // 生成逻辑
        if (state == 5) sink.error(new RuntimeException("出错了"));
        sink.next("3 x " + state + " = " + 3 * state); // next 用于发射一个数据
        if (state == 10) sink.complete();
        return state + 1; // 更新状态，供下一次调用
    }, (state) -> System.out.println("finally: " + state));

flux.subscribe(System.out::println);

// 注意上述代码会打印：finally: 6，这是因为 sink.error() 不会导致跳过后面的代码，state + 1 仍会执行，如果修改为 throw 一个异常，则 finally state 为 5
```

#### create

`create` 相比于 `generate`，使用线程安全的 `FluxSink`，可以在每次回调中，调用多次 next 方法发射数据，并且可以在多线程中使用。

- `create` 在将现有 API 与响应式连接起来时非常有用，例如桥接基于监听器的异步数据处理 API：

```java
// 方法声明如下：
public static <T> Flux<T> create(Consumer<? super FluxSink<T>> emitter, OverflowStrategy backpressure)

// 定义监听器接口（模拟现有异步API）
interface DataListener<T> {
    void onData(T data); // 接收单条数据
    void onComplete();   // 处理完成
    void onError(Throwable e); // 处理错误
}

// 模拟异步数据处理器
static class AsyncDataProcessor {
    public void register(DataListener<String> listener) {
        // 模拟异步产生数据（实际场景可能是IO、网络操作等）
        new Thread(() -> {
            try {
                for (int i = 1; i <= 5; i++) {
                    Thread.sleep(200); // 模拟耗时操作
                    listener.onData("数据" + i);
                }
                listener.onComplete(); // 数据发送完毕
            } catch (InterruptedException e) {
                listener.onError(e);
            }
        }).start();
    }
}

@Test
public void test() throws Exception {
    AsyncDataProcessor processor = new AsyncDataProcessor();
    Flux<String> flux = Flux.create(sink -> {
        // 注册监听器，将回调事件转换为 Flux 信号
        processor.register(new DataListener<String>() {
            @Override
            public void onData(String data) {
                sink.next(data); // 发射数据
            }
            @Override
            public void onComplete() {
                sink.complete(); // 结束序列
            }
            @Override
            public void onError(Throwable e) {
                sink.error(e); // 发射错误
            }
        });
    });

    // 订阅并消费数据
    flux.subscribe(
        data -> System.out.println("接收: " + data),
        error -> System.err.println("错误: " + error.getMessage()),
        () -> System.out.println("接收完成")
    );

    Thread.sleep(5000);
}
```

- 可以通过 `OverflowStrategy` 来指定背压策略：
    - `IGNORE` 完全忽略背压，继续发送数据，可能导致异常或内存溢出；
    - `ERROR` 当下游无法跟上时，抛出 `IllegalStateException`；
    - `DROP` 丢弃当前数据项，不发送给下游；
    - `LATEST` 只保留最新的数据项，旧的被覆盖；
    - `BUFFER`（默认策略，将所有数据缓冲，可能导致内存溢出。

```java
Flux.create(sink -> {
            // 模拟快速生产
            for (int i = 0; i < 10; i++) {
                sink.next(i);
                try {
                    Thread.sleep(10);
                } catch (InterruptedException e) {
                    sink.error(e);
                }
            }
            sink.complete();
        }, FluxSink.OverflowStrategy.LATEST // 改成不同策略试试
    )
    .publishOn(Schedulers.newSingle("slow-consumer"), 1) // 模拟慢速订阅者
    .subscribe(data -> {
        System.out.println("消费: " + data);
        try {
            Thread.sleep(30); // 模拟慢速消费
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    });
```

- 结合 `onRequest` 实现推拉模式

```java
Flux<String> flux = Flux.create(sink -> {
    // 监听下游请求量
    sink.onRequest(n -> {
            System.out.println("收到下游请求，需要 " + n + " 条数据");
            // 按需产生数据
            for (int i = 0; i < n; i++) {
                sink.next("数据" + i);
            }
        })
        .onCancel(() -> System.out.println("onCancel"))
        .onDispose(() -> System.out.println("onDispose"));
});
// limitRequest 满足后会发出 cancel 信号
flux.limitRequest(5).subscribe(System.out::println);
```

### 常用操作

操作符参考：[Which operator do I need?](https://projectreactor.io/docs/core/release/reference/apdx-operatorChoice.html)

#### subscribe、dispose

用于订阅并触发序列，全参数的构造方法如下：

```java
subscribe(
    // 消费每个值的逻辑
    Consumer<? super T> consumer,
    // 错误处理，针对的是上游发布者的异常
    Consumer<? super Throwable> errorConsumer,
    // 序列必须完整且无错误地执行完毕时，才执行
    Runnable completeConsumer,
    // onSubscribe 时触发, 用于初始化 request 默认行为是 request(Long.MAX_VALUE)
    // 官方 API 已不建议使用该参数，而是自定义 `Subscriber` 实现去精细化控制
    Consumer<? super Subscription> subscriptionConsumer
);
```

序列的执行中参数传递包含了**元素**(数据) 和**信号**，信号表示当前状态，参考 `reactor.core.publisher.SignalType` 枚举类：

```java
// A signal when the subscription is triggered
SUBSCRIBE
// A signal when a request is made through the subscription
REQUEST
// A signal when the subscription is cancelled
CANCEL
// A signal when an operator receives a subscription
ON_SUBSCRIBE
// A signal when an operator receives an emitted value
ON_NEXT
// A signal when an operator receives an error
ON_ERROR
// A signal when an operator completes
ON_COMPLETE
// A signal when an operator completes
AFTER_TERMINATE
// A context read signal
CURRENT_CONTEXT
// A context update signal
ON_CONTEXT
```

如何取消订阅：

```java
CountDownLatch latch = new CountDownLatch(1);

// 返回值是一个 Disposable 表示可以取消订阅
Disposable f1 = Flux.range(1, 5)
    .delayElements(Duration.ofSeconds(1)) // 1s 生成一个
    .subscribe(
        i -> System.out.println("接收到元素: " + i),
        error -> System.err.println("发生错误: " + error),
        () -> {
            System.out.println("完成");
            latch.countDown();
        }
    );

boolean await = latch.await(2, TimeUnit.SECONDS);
if (!await) {
    f1.dispose(); // 如果没有消费完整个序列，不会触发 completeConsumer
}
```

取消操作是一个信号，表明源应该停止生成元素。然而，并不能保证会立即停止：有些源生成元素的速度可能非常快，以至于在收到取消指令之前就已经完成了。

#### BaseSubscriber

自定义 Subscribe，可以继承 BaseSubscribe 类，重写相应的钩子方法，可以实现比 lambda 方式的 subscribe() 更多的功能。

```java
class MySubscriber<T> extends BaseSubscriber<T> {
    @Override
    public void hookOnSubscribe(Subscription subscription) {
        System.out.println("hookOnSubscribe");
        request(1);
    }

    @Override
    public void hookOnNext(T value) {
        System.out.println("hookOnNext: " + value);
        request(1);
    }

    @Override
    protected void hookOnComplete() {
        System.out.println("hookOnComplete");
    }

    @Override
    protected void hookOnError(Throwable throwable) {
        System.out.println("hookOnError: " + throwable);
    }

    @Override
    protected void hookOnCancel() {
        System.out.println("hookOnCancel");
    }

    @Override
    protected void hookFinally(SignalType type) {
        System.out.println("hookFinally: " + type);
    }
}

// 执行
Flux.range(1, 3).map(i -> {
    if (i <= 2) return i;
    throw new RuntimeException("出错了");
}).subscribe(new MySubscriber<>());
// 将打印
hookOnSubscribe
hookOnNext: 1
hookOnNext: 2
hookOnError: java.lang.RuntimeException: 出错了
hookFinally: onError
```

#### limitRate/limitRequest

**limitRate** 用于实现**预取**，将下游订阅者的背压信号，分批次发送，有两个方法：

1. `limitRate(int prefetchRate)` 表示执行时第一次 `request(prefetchRate)`，一旦算子发现 75% 的预取请求已得到满足，它就会向上游重新请求 75% 的内容 (向上取整)。
2. `limitRate(int highTide, int lowTide)` 表示执行时第一次 `request(highTide)`，每消费 lowTide 个后都执行 `request(lowTide)`，特别地：
    - 当 lowTide == 0 时，相当于禁用预取，每次消费完 highTide 个再继续 `request(highTide)`；
    - 当 lowTide >= highTide 时，恢复 75% 策略，等同于 `limitRate(highTide)`。

```java
CountDownLatch latch = new CountDownLatch(1);

Flux.range(1, 50)
    .log()
    // 第一次 request(10)，后续每消费 (75%*10)=8 个后，都 request(8)
    .limitRate(10)
    // 第一次 request(10)，每消费 2 个后，都 request(2)
    .limitRate(10, 2)
    // 禁用预取，每次消费完 10 个再 request(10)
    .limitRate(10, 0)
    // 等同于 limitRate(10)
    .limitRate(10, 10)
    .subscribe(
        System.out::println,
        System.err::println,
        latch::countDown
    );

latch.await();
System.out.println("DONE");
```

**limitRequest(N)** 用于限制下游最大请求量，当上游发送出 N 个数据后，会认为序列已完成，向下游发送 `onComplete` 信号，并 `cancel()`。

```java
CountDownLatch latch = new CountDownLatch(1);

Flux.range(1, 50)
    .log()
    .limitRequest(10) // 最终输出只打印到 10
    .subscribe(
        System.out::println,
        System.err::println,
        latch::countDown
    );

latch.await();
System.out.println("DONE");
```

#### map、filter、handle

`Flux<R> handle(BiConsumer<T, SynchronousSink<R>>)` 使用 SynchronousSink 只能逐个发送数据，相当于 map 与 filter 的结合。

```java
Flux.range(1, 10)
    .map(item -> item * 2)
    .filter(item -> item % 3 == 0)
    .subscribe(System.out::println);
// 等价于
Flux.range(1, 10)
    .handle((item, sink) -> {
        int i = item * 2;
        if (i % 3 == 0) {
            sink.next(i); // 满足条件则发送数据，相当于 filter
        }
    })
    .subscribe(System.out::println);
```

### 线程调度

**默认情况**下，大多数操作会与前一个操作在相同线程中执行，最顶层的操作会在调用它的线程中运行 (就是订阅动作的执行线程)。

```java
final Mono<String> mono = Mono.just("hello ");

// 输出 hello main
mono.subscribe(v ->
    System.out.println(v + Thread.currentThread().getName())
);
// 输出 hello Thread-2
Thread t = new Thread(() -> mono
    .subscribe(v ->
        System.out.println(v + Thread.currentThread().getName())
    )
);
t.start();
t.join();
```

在 Reactor 中，执行线程由 `Scheduler` 调度器决定，它的几个静态方法如下，用于返回特定的调度器实例：

- `Schedulers.immediate()`：相当于默认未指定，在调用线程中执行；
- `Schedulers.single()`：在调度器被释放之前，此方法会为所有调用者复用同一个线程；
- `Schedulers.newSingle()`：每次调用都新开一个线程；
- `Schedulers.boundedElastic()`：一个有界弹性线程池，常用于包装同步阻塞调用；
    - 基于 `ExecutorService`，空闲时间默认 60s，线程数为 CPU 核心数 * 10，队列长度限制为 100_000；
- `Schedulers.parallel()`：一个固定的线程池，工作线程与 CPU 核心数量相同；
- `Schedulers.newXXX()` 方法用于创建各种类型调度器的新实例。例如，`Schedulers.newParallel(xxx)` 会创建一个名为 `xxx` 的新并行调度器。  

在链式调用中，通过 `publishOn` 和 `subscribeOn` 方法来切换执行上下文到指定的调度器，需要特别注意 `publishOn` 在链式调用中的位置。

#### publishOn

`publishOn` 从上游获取信号，并在下游重新播放这些信号，同时在 `Scheduler` 关联的一个工作线程上执行回调。因此它会**影响后续操作符的执行位置**（直到另一个 `publishOn` 被链接进来）。

```java
final Flux<String> flux = Flux
    .range(1, 2)
    .map(i -> {
        log.info("map1");
        return 10 + i;
    })
    // 后续操作将被调度到新的线程
    .publishOn(Schedulers.parallel())
    .map(i -> {
        log.info("map2");
        return "value " + i;
    });

new Thread(() -> flux.subscribe(log::info), "t1").start();
```

上面代码中，当不使用 `publishOn` 或使用 `Schedulers.immediate()` 时，都将在 `t1` 线程上执行 (即发生了订阅的线程)。当使用 `Schedulers.parallel()` 时，可以看到第一个 `map` 操作在 `t1` 上执行，第二个 map 和消费操作均在 `parallel-1` 上执行。

#### subscribeOn

`subscribeOn` 应用于订阅过程，即构建整个链路时，它会更改整个链的订阅线程，放在哪里都行，通常建议将其直接置于数据源之后，多次调用时，第一个 (最靠近源头的) 生效。

```java
final Flux<String> flux = Flux
    .range(1, 2)
    .subscribeOn(Schedulers.parallel())
    .map(i -> {
        log.info("map1");
        return 10 + i;
    })
    .publishOn(Schedulers.single())
    .map(i -> {
        log.info("map2");
        return "value " + i;
    });

new Thread(() -> flux.subscribe(log::info), "t1").start();

Thread.sleep(10000);
```

上面代码中，尽管是在 `t1` 上进行订阅动作，但实际会被调度到 `parallel-1` 上执行，第一个 map 操作在 `parallel-1` 上执行，第二个 map 和消费操作均在 `single-1` 上执行，并且将 `subscribeOn` 放置在调用链上的任意位置，均不影响结果。

#### parallel 并行消费

使用 `parallel()` 可以将流转换为一个 `ParallelFlux`，配合 `ranOn()` 指定调度器，可以实现并行执行消费逻辑，如果要合并成串行执行，可以调用 `sequential()`。

```java
Flux.range(1, 10)
    .parallel(2)
    .runOn(Schedulers.parallel())
    // map 在两个线程上并行
    .map(i -> {
        log.info("map -> {}", i);
        return i * i;
    })
    // 转换为串行，最终消费在一个线程上执行
    .sequential()
    .subscribe(i -> log.info("sub -> {}", i));
```

#### 包装同步阻塞调用

将同步阻塞操作提交到 `boundedElastic` 中去执行，避免阻塞其他非阻塞工作线程。

```java
Mono blockingWrapper = Mono.fromCallable(() -> {
    return /* make a remote synchronous call */
});
blockingWrapper = blockingWrapper.subscribeOn(Schedulers.boundedElastic());
```

### 异常处理

响应式序列中的任何错误都是一个终止事件，即使使用了错误处理操作符，它也不会让原始序列继续。错误信号将沿着操作符链传播到最后一步，即 `Subscribe` 的 `onError` 方法，若未定义 `onError` 方法，则会抛出 `ErrorCallbackNotImplemented` 异常。

- `onErrorReturn`：捕获异常并返回一个默认值；
- `onErrorComplete`：捕获并忽略异常，将 `onError` 信号转为 `onComplete`；
- `onErrorResume`：捕获并执行处理逻辑 (可以返回动态值、抛出异常)；
- `doOnError`：感知到异常后执行处理逻辑，但原样抛出，即不影响错误信号传播；
- `doFinally`：相当于 finally 块；

```java
Flux.just(1, 2, 0, 3)
    .map(i -> "10 / " + i + " = " + (10 / i))
    // 返回默认值
    .onErrorReturn(e -> e.getMessage().equals("/ by zero"), "fallbackValue")
    // 忽略错误
    .onErrorComplete(e -> e.getMessage().equals("/ by zero"))
    // 抛出新错误
    .onErrorResume(e -> Mono.error(new Exception("出错了")))
    // 返回动态值
    .onErrorResume(e -> Mono.just("someValue"))
    .doFinally(signalType -> System.out.println("Finally: " + signalType))
    .subscribe(
        System.out::println,
        System.err::println,
        () -> System.out.println("Done")
    );
```

### 重试

使用 `retry(n)` 可以实现重试，**本质是重新订阅**，实际上是一个全新的序列，原序列已经终止。

```java
Flux.interval(Duration.ofMillis(250))
    .map(input -> {
        if (input < 3) return "tick " + input;
        throw new RuntimeException("boom");
    })
    .elapsed() // 用于记录每个元素与前一个元素经过的间隔时间
    .retry(1)
    .subscribe(System.out::println, System.err::println);
```

使用 `retryWhen` 可以实现自定义条件重试失败序列。retryWhen 接收一个伙伴序列，当上游序列产生错误时，会向该伙伴序列发送一个 `RetrySignal`（包含错误信息、重试次数等元数据），用户通过自定义逻辑处理 `RetrySignal` 并返回一个新的 `Publisher` 来控制重试行为：

- 若伙伴序列发射一个值，则触发重试，即重新订阅；
- 若伙伴序列正常完成，则终止重试，且若有上游异常信号，会被忽略 (下游收不到)，转成完成信号；
- 若伙伴序列产生错误，则终止重试，下游可以感知到该错误。

```java
Flux.interval(Duration.ofMillis(250))
    .map(input -> {
        if (input < 3) return "tick " + input;
        throw new RuntimeException("boom");
    })
    .elapsed()
    .retryWhen(Retry.from(companion -> companion.handle(
        (retrySignal, sink) -> {
            // 自定义重试条件
            if (retrySignal.totalRetries() < 1) {
                sink.next(retrySignal.totalRetries()); // 触发重试
            } else {
                // 终止重试并传播错误，不传播的话会被忽略，即下游将触发 onComplete
                sink.error(retrySignal.failure());
            }
        }
    )))
    .subscribe(
        System.out::println,
        System.err::println,
        () -> System.out.println("Done")
    );
```

常见的重试策略：

```java
// 实现最多 n 次重试
flux.retryWhen(Retry.max(3));
// 仅对特定错误重试
flux.retryWhen(Retry.max(3).filter(e -> e instanceof TimeoutException));
// 指数退避重试，最多 3 次，初始延迟 1000ms(后面每次*2)，随机抖动 ±50%
flux.retryWhen(Retry.backoff(3, Duration.ofMillis(1000)).jitter(0.5)
                // 每次重试时执行
                .doAfterRetry(rs -> System.out.println("retried at " + LocalTime.now() + ", attempt " + rs.totalRetries()))
                // 达到重试次数时，抛出原始异常
                .onRetryExhaustedThrow((spec, rs) -> rs.failure())
            )
            .elapsed() // 记录间隔时间
            .subscribe(
                System.out::println,
                System.err::println,
                () -> System.out.println("Done")
            );
```

### Sinks

sink 译为水槽，在 Reactor 中可以理解为接收器，`Sinks` API 允许我们手动且线程安全的触发信号、构建 `Publisher` 并定义与下游交互的逻辑。

`Sinks.One` 用于处理单个元素，`Sinks.Many` 用于处理多元素序列。通过调用其 `emit*` 或 `tryEmit*` 方法，发送一个值。其中 tryEmit 会立即返回发送结果，供调用方处理；而 emit 可以通过指定 `EmitFailureHandler` 来进行处理。

- Sinks.one 举例：

```java
// Sinks.One 只能发送一次
final Sinks.One<String> one = Sinks.one();
// 转换为 Mono 并进行订阅
one.asMono().subscribe(System.out::println, System.err::println);
// 尝试发送数据
Sinks.EmitResult hello = one.tryEmitValue("hello");
Sinks.EmitResult world = one.tryEmitValue("world");
// 查看发送结果
System.out.println("hello: " + hello); // OK
System.out.println("world: " + world); // FAIL_TERMINATED
```

在 Sinks.Many 中可以使用 `unicast()`、`multicast()` 指定单播还是多播；使用 `onBackpressureBuffer()` 指定背压缓冲区大小；使用 `replay()` 缓存历史数据向新订阅者重放；使用 `unsafe()` 移除线程安全检查，降低开销，适用于能保证外部同步的场景。

1. `Sinks.many().unicast().onBackpressureBuffer(Queue?)` 单播 Sinks.Many 可以通过使用内部缓冲区来处理背压。

```java
// 创建一个单播序列，缓存数量为 2
final Sinks.Many<String> many = Sinks.many().unicast().onBackpressureBuffer(new ArrayBlockingQueue<>(2));
final Flux<String> flux = many.asFlux();

// 订阅前发送三个数据，前两个被缓存
Sinks.EmitResult emitResult = many.tryEmitNext("aaa");
System.out.println("emitResult aaa : " + emitResult); // OK
emitResult = many.tryEmitNext("bbb");
System.out.println("emitResult bbb : " + emitResult); // OK
emitResult = many.tryEmitNext("ccc");
System.out.println("emitResult ccc : " + emitResult); // 失败：FAIL_ZERO_SUBSCRIBER

// 慢速消费
flux.subscribeOn(Schedulers.parallel())
    .subscribe(item -> {
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            System.out.println("sub1: " + item);
        },
        System.err::println,
        () -> System.out.println("Done")
    );
);

// flux.subscribe(); // 订阅多次会报错 IllegalStateException

// 快速生产
for (int i = 0; i < 50; i++) {
    emitResult = many.tryEmitNext(String.valueOf(i));
    if (emitResult != Sinks.EmitResult.OK) {
        // 生产过快会打印 emitResult x : FAIL_OVERFLOW
        System.out.println("emitResult " + i + " : " + emitResult);
    }
}

Thread.sleep(5000);
many.tryEmitComplete(); // 完成信号
```

2. `Sinks.many().multicast().onBackpressureBuffer(int bufferSize?)` 多播 Sinks.Many 可以向多个订阅者发送信号，同时为每个订阅者处理背压问题，订阅者仅接收在其订阅后通过接收器推送的信号。

```java
// 创建一个多播 Sink，缓存数量为 2
final Sinks.Many<String> many = Sinks.many().multicast().onBackpressureBuffer(2);
final Flux<String> flux = many.asFlux();

/**
 * 与单播不同，多播 sink onBackpressureBuffer 是为每个订阅者维护的被压缓冲区，
 * 在没有订阅之前发送的数据，其中一部分会被缓存起来作为 warm up 数据，
 * 第一个订阅者会接收到这些值，后续订阅者只能接收到订阅之后发送的值
 */
for (int i = 1; i <= 100; i++) {
    Sinks.EmitResult emitResult = many.tryEmitNext(String.valueOf(i));
    if (emitResult != Sinks.EmitResult.OK) {
        // 若干个成功之后，会打印 FAIL_ZERO_SUBSCRIBER
        System.out.println("[" + Thread.currentThread().getName() + "] warm emit " + i + " : " + emitResult);
    }
}
// 第一个订阅者会接收到一部分 warm up 数据
flux.publishOn(Schedulers.newSingle("quick"))
    .elapsed()
    .subscribe(item -> {
        System.out.println("[" + Thread.currentThread().getName() + "] quick handle "+ item);
    }, System.err::println);

// 第二个订阅者，只能接收到订阅之后的数据
flux.publishOn(Schedulers.newSingle("slow"))
    .subscribe(item -> {
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        System.out.println("[" + Thread.currentThread().getName() + "] slow handle "+ item);
    }, System.err::println);

Thread.sleep(1000); // 确保订阅动作完成

new Thread(() -> {
    for (int i = 101; i <= 800; i++) {
        Sinks.EmitResult emitResult = many.tryEmitNext(String.valueOf(i));
        if (emitResult != Sinks.EmitResult.OK) {
            System.out.println("[" + Thread.currentThread().getName() + "] emit " + i + " : " + emitResult);
        }
    }
    System.out.println(Thread.currentThread().getName() + ": 发布完成");
}, "t1").start();
```

### Context 上下文

`Context` 用于在响应式序列中传递上下文信息，它类似于 Map 存储键值对，解决了多线程环境中无法使用 ThreadLocal 的问题。

```java
String key = "message";
Mono.just("Hello")
    .flatMap(s -> Mono.deferContextual(ctx ->
        Mono.just(s + " " + ctx.get(key))
    ))
    .contextWrite(ctx -> ctx.put(key, "Reactor")) // 覆盖掉 World
    .contextWrite(ctx -> ctx.put(key, "World"))
    .subscribe(System.out::println);
// 输出 Hello Reactor
```

在调用链中，`contextWrite` 的位置很重要，因为订阅信号是自下而上流动的，所以其内容只能被位于其上方的操作符看到，写入多次会被覆盖。

如果在两个 `contextWrite` 中间再添加一个 `flatMap` 操作，如下所示：

```java
String key = "message";
Mono.just("Hello")
    .flatMap(s -> Mono.deferContextual(ctx ->
        Mono.just(s + " " + ctx.get(key)) // 只能看到 Reactor
    ))
    .contextWrite(ctx -> ctx.put(key, "Reactor"))
    .flatMap(s -> Mono.deferContextual(ctx ->
        Mono.just(s + " " + ctx.get(key)) // 只能看到 World
    ))
    .contextWrite(ctx -> ctx.put(key, "World"))
    .subscribe(System.out::println);
// 输出 Hello Reactor World
```

如果在 `flatMap` 中调用 `contextWrite`，那么它对外部序列将不可见：

```java
String key = "message";
Mono.just("Hello")
    .flatMap(s -> Mono.deferContextual(ctx ->
        Mono.just(s + " " + ctx.get(key))
    ))
    .flatMap(s -> Mono.deferContextual(ctx ->
            Mono.just(s + " " + ctx.get(key)))
        .contextWrite(ctx -> ctx.put(key, "Reactor")) // 不会影响主序列
    )
    .contextWrite(ctx -> ctx.put(key, "World")) // 影响主序列
    .subscribe(System.out::println);
// 输出 Hello World Reactor
```

## WebFlux

> [!note] 对于 Web 容器，请参考：[此处](https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html#webflux-server-choice)  
> Spring WebFlux 在 Tomcat、Jetty、Servlet 容器以及非 Servlet 运行时（如 Netty 和 Undertow）上均受支持，可以和 Spring MVC 结合使用。Tomcat/Jetty 需通过 Servlet 3.1+ 的非阻塞 API 适配 WebFlux，对于 Undertow，Spring WebFlux 直接使用 Undertow API，而不使用 Servlet API。

与 Spring MVC 对比：

| 特性        | Spring MVC               | Spring WebFlux                                                                                             |
| --------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 线程模型      | 每个请求一个线程                 | 少量线程处理大量请求（事件驱动）                                                                                           |
| 性能场景      | 简单/中小型应用，IO 密度不高         | 高并发、IO 密集型系统（如网关、推送服务）                                                                                     |
| 前端控制器     | DispatcherServlet        | [DispatcherHandler](https://docs.spring.io/spring-framework/reference/web/webflux/dispatcher-handler.html) |
| 请求、响应     | ServletRequest/Response  | ServerWebExchange                                                                                          |
| 过滤器       | Filter                   | WebFilter                                                                                                  |
| 异常处理器     | HandlerExceptionResolver | DispatcherExceptionHandler                                                                                 |
| 自定义配置     | WebMvcConfigurer         | WebFluxConfigurer                                                                                          |
| Rest 请求工具 | RestTemplate             | WebClient                                                                                                  |

### 一个与大模型交互的例子

```java
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/web-client")
public class WebClientChatController {

    private final String modelName = "deepseek-r1:1.5b";
    private final String apiHost = "http://127.0.0.1:11434/v1/chat/completions";
    private final String apiKey = "ollama";

    private final HttpClient httpClient = HttpClient.create()
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)
        .responseTimeout(Duration.ofMinutes(5))
        .doOnConnected(conn -> conn
            .addHandlerLast(new ReadTimeoutHandler(30, TimeUnit.SECONDS))
            .addHandlerLast(new WriteTimeoutHandler(30, TimeUnit.SECONDS))
        );

    private final WebClient webClient = WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .baseUrl(apiHost)
        .defaultHeader("Authorization", "Bearer " + apiKey)
        .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 存储取消信号
    private final Map<String, Sinks.One<String>> cancelSignalMap = new ConcurrentHashMap<>();
    // 存储 cachedFlux
    private final Map<String, Flux<String>> cachedFluxMap = new ConcurrentHashMap<>();

    @GetMapping(value = "/ai/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chat(@RequestParam(value = "message", defaultValue = "你好") String message) throws IOException {
        // String requestId = UUID.randomUUID().toString();
        String requestId = "123456";

        Map<String, Object> params = Map.of(
            "model", modelName,
            "messages", Collections.singletonList(Map.of("role", "user", "content", message)),
            "stream", true
        );

        // 取消信号
        Sinks.One<String> cancelSignal = Sinks.one();
        cancelSignalMap.put(requestId, cancelSignal);

        Flux<String> cachedFlux = webClient.post()
            .bodyValue(objectMapper.writeValueAsString(params))
            .accept(MediaType.TEXT_EVENT_STREAM)
            .exchangeToFlux(response -> {
                if (response.statusCode().is2xxSuccessful()) {
                    return response.bodyToFlux(String.class);
                } else {
                    return response.createException().flatMapMany(Flux::error);
                }
            })
            // takeUntilOther(publisher) 表示当订阅的 publisher 发出任意消息时，complete 自己
            .takeUntilOther(cancelSignal.asMono())
            .map(chunk -> {
                if ("[DONE]".equals(chunk)) return chunk;
                try {
                    return Optional.ofNullable(objectMapper.readValue(chunk, Map.class))
                        .map(map -> map.get("choices"))
                        .map(choices -> ((List<?>) choices).get(0))
                        .map(choice -> ((Map<?, ?>) choice).get("delta"))
                        .map(delta -> ((Map<?, ?>) delta).get("content").toString())
                        .orElse("");
                } catch (JsonProcessingException e) {
                    throw new RuntimeException(e);
                }
            })
            // cache 之前抛出异常会导致一个 Operator called default onErrorDropped 打印，若此处使用 onErrorResume 吃掉异常，则后续订阅者不会触发 onError 需要在 onComplete 中根据数据状态判断
            /* .onErrorResume(throwable -> {
                return Mono.just(throwable.getMessage());
            }) */
            // 转换为热流，当有第一个订阅时才开始流动，cachedFlux 引用不释放则缓存一直存在，若使用 cache(ttl) 则缓存会自动过期，过期后当有订阅时重新启动流(发出http请求)
            .cache();

        cachedFluxMap.put(requestId, cachedFlux);
        StringBuilder sb = new StringBuilder();

        cachedFlux.publishOn(Schedulers.boundedElastic())
            .doOnNext(chunk -> {
                if (!"[DONE]".equals(chunk)) {
                    sb.append(chunk);
                }
            })
            // .reduce(new StringBuilder(), (sb, chunk) -> !"[DONE]".equals(chunk) ? sb.append(chunk) : sb)
            .doOnComplete(() -> {
                log.info("doOnComplete: {}", sb);
                // 保存结果
            })
            .doOnError(throwable -> {
                if ("MANUAL_CANCEL".equals(throwable.getMessage())) {
                    log.info("MANUAL_CANCEL, {}", requestId);
                    // 手动停止，保存结果
                    return;
                }
                log.error("doOnError", throwable);
            })
            .doFinally(signalType -> {
                log.info("doFinally: {}", signalType);
                cancelSignalMap.remove(requestId);
                cachedFluxMap.remove(requestId);
            })
            .subscribe();

        return Flux.concat(Flux.just(requestId), cachedFlux)
            .onErrorResume(throwable -> {
                if ("MANUAL_CANCEL".equals(throwable.getMessage())) {
                    return Mono.just("(手动终止)");
                } else {
                    return Mono.error(throwable);
                }
            });
    }

    @GetMapping(value = "/ai/stop-chat")
    public ResponseEntity<Map<?, ?>> stopChat(@RequestParam("requestId") String requestId) {
        Sinks.One<String> sink = cancelSignalMap.get(requestId);
        if (sink != null) {
            Sinks.EmitResult result = sink.tryEmitError(new RuntimeException("MANUAL_CANCEL"));
            if (result.isSuccess()) {
                log.info("成功发送手动取消信号。RequestId: {}", requestId);
            } else if (result == Sinks.EmitResult.FAIL_TERMINATED) {
                // 这是一个预期的场景：流已经因为其他原因（比如正常完成或之前的取消）而终止了
                log.info("流已终止，无需重复取消。RequestId: {}", requestId);
            } else {
                // 其他可能的失败原因，如 Sinks.EmitResult.FAIL_NON_SERIALIZED (并发问题)
                log.warn("发送手动取消信号失败，原因: {}。RequestId: {}", result, requestId);
            }
        }
        return ResponseEntity.ok(Map.of("message", "已取消"));
    }

    @GetMapping(value = "/ai/attach-chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> attachChat(@RequestParam("requestId") String requestId) {
        Flux<String> flux = cachedFluxMap.get(requestId);
        if (flux != null) {
            return flux.onErrorResume(throwable -> {
                if ("MANUAL_CANCEL".equals(throwable.getMessage())) {
                    return Mono.just("(手动终止)");
                } else {
                    return Mono.error(throwable);
                }
            });
        } else {
            return Flux.just("[NOT FOUND]");
        }
    }

}
```

#todo
