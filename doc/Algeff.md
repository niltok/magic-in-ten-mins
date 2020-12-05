# 十分钟魔法练习：代数作用

### By 「玩火」

> 前置技能：Java基础，续延

## 可恢复异常

有时候我们希望在异常抛出后经过保存异常信息再跳回原来的地方继续执行。

显然Java默认异常处理无法直接实现这样的需求，因为在异常抛出时整个调用栈的信息全部被清除了。

但如果我们有了异常抛出时的续延那么可以同时抛出，在 `catch` 块中调用这个续延就能恢复之前的执行状态。

下面是实现可恢复异常的 `try-catch` ：

```java
Stack<BiConsumer<Exception, Runnable>> 
    cs = new Stack<>();

void Try(
        Consumer<Runnable> body,
        TriConsumer<Exception, 
                    Runnable, 
                    Runnable>
            handler,
        Runnable cont) {
    
    cs.push((e, c) -> 
            handler.accept(e, cont, c));
    body.accept(cont);
    cs.pop();
}

void Throw(Exception e, Runnable cont) {
    cs.peek().accept(e, cont);
}
```

然后就可以像下面这样使用：

```java
void test(int t) {
    Try(
    cont -> {
        System.out.println("try");
        if (t == 0)
            Throw(
            new ArithmeticException(),
            () -> {
                System.out.println(
                    "resumed");
                cont.run();
            });
        else {
            System.out.println(100 / t);
            cont.run();
        }
    },
    (e, cont, resume) -> {
        System.out.println("catch");
        resume.run();
    },
    () -> System.out.println("final"));
}
```

而调用 `test(0)` 就会得到：

```
try
catch
resumed
final
```

## 代数作用

如果说在刚刚异常恢复的基础上希望在恢复时修补之前的异常错误就需要把之前的 `resume` 函数加上参数，这样修改以后它就成了代数作用（Algebaic Effect）的基础工具：

```java
Stack<BiConsumer<Object, 
                 Consumer<Object>>> 
    cs = new Stack<>();

void Try(
        Consumer<Runnable> body,
        TriConsumer<Object, 
                    Runnable, 
                    Consumer<Object>>
            handler,
        Runnable cont) {
    
    cs.push((e, c) -> 
            handler.accept(e, cont, c));
    body.accept(cont);
    cs.pop();
}

void Perform(Object e, 
             Consumer<Object> cont) {
    cs.peek().accept(e, cont);
}
```

使用方式如下：

```java
void test(int t) {
    Try(
    cont -> {
        System.out.println("try");
        if (t == 0)
            Perform(
            new ArithmeticException(),
            v -> {
                System.out.println(
                    "resumed");
                System.out.println(
                    100 / (Integer) v);
                cont.run();
            });
        else {
            System.out.println(100 / t);
            cont.run();
        }
    },
    (e, cont, resume) -> {
        System.out.println("catch");
        resume.accept(1);
    },
    () -> System.out.println("final"));
}
```

而这个东西能实现不只是异常的功能，从某种程度上来说它能跨越函数发生作用（Perform Effect）。

比如说现在有个函数要记录日志，但是它并不关心如何记录日志，输出到标准流还是写入到文件或是上传到数据库。这时候它就可以调用

```java
Perform(new LogIt(INFO, "test"), ...);
```

来发生（Perform）一个记录日志的作用（Effect）然后再回到之前调用的位置继续执行，而具体这个作用产生了什么效果就由调用这个函数的人实现的 `try` 中的 `handler` 决定。这样发生作用和执行作用（Handle Effect）就解耦了。

进一步讲，发生作用和执行作用是可组合的。对于需要发生记录日志的作用，可以预先写一个输出到标准流的的执行器（Handler）一个输出到文件的执行器然后在调用函数的时候按需组合。这也就是它是代数的（Algebiac）的原因。

细心的读者还会发现这个东西还能跨函数传递数据，在需要某个量的时候调用

```java
Perform(new Ask("config"), ...);
```

就可以获得这个量而不用关心这个量是怎么来的，内存中来还是读取文件或者 HTTP 拉取。从而实现获取和使用的解耦。

而且这样的操作和状态单子非常非常像，实际上它就是和相比状态单子来说没有修改操作的读取器单子（Reader Monad）同构。

也就是说把执行器函数作为读取器单子的状态并在发生作用的时候执行对应函数就可以达到和用续延实现的代数作用相同的效果，反过来也同样可以模拟。



