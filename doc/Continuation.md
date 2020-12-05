# 十分钟魔法练习：续延

### By 「玩火」

> 前置技能：简单Java基础

## 续延

续延（Continuation）是指代表一个程序未来的函数，其参数是一个程序过去计算的结果。

比如对于这个程序：

```java
void test() {
    int i = 1;                // 1
    i++;                      // 2
    System.out.println(i);    // 3
}
```

它第二行以及之后的续延就是：

```java
void cont(int i) {
    i++;                      // 2
    System.out.println(i);    // 3
}
```

而第三行之后的续延是：

```java
void cont(int i) {
    System.out.println(i);    // 3
}
```

实际上可以把这整个程序的每一行改成一个续延然后用函数调用串起来变成和刚才的程序一样的东西：

```java
void cont1() {
    int i = 1;                // 1
    cont2(i);
}
void cont2(int i) {
    i++;                      // 2
    cont3(i);
}
void cont3(int i) {
    System.out.println(i);    // 3
}
void test() {
    cont1();
}
```

## 续延传递风格

续延传递风格（Continuation-Passing Style, CPS）是指把程序的续延作为函数的参数来获取函数返回值的编程思路。

听上去很难理解，把上面的三个 `cont` 函数改成CPS就很好理解了：

```java
void logic1(Consumer<Integer> f) {
    int i = 1;
    f.accept(i); // return i
}
void logic2(int i, Consumer<Integer> f) {
    i++;
    f.accept(i);
}
void logic3(int i, Consumer<Integer> f) {
    System.out.println(i);
    f.accept(i);
}
void test() {
         logic1( // 获取返回值 i
    i -> logic2(i, 
    i -> logic3(i, 
    i -> {})));
}
```

每个 `logic` 函数的最后一个参数 `f` 就是整个程序的续延，而在每个函数的逻辑结束后整个程序的续延也就是未来会被调用。而 `test` 函数把整个程序组装起来。

小朋友，你有没有觉得最后的 `test` 函数写法超眼熟呢？实际上这个写法就是 Monad 的写法， Monad 的写法就是 CPS 。

另一个角度来说，这也是回调函数的写法，每个 `logic` 函数完成逻辑后调用了回调函数 `f` 来完成剩下的逻辑。实际上，异步回调思想很大程度上就是 CPS 。

## 有界续延

考虑有另一个函数 `callT` 调用了 `test` 函数，如：

```java
void callT() {
    test();
    System.out.println(3);
}
```

那么对于 `logic` 函数来说调用的 `f` 这个续延并不包括 `callT` 中的打印语句，那么实际上 `f` 这个续延并不是整个函数的未来而是 `test` 这个函数局部的未来。

这样代表局部程序的未来的函数就叫有界续延（Delimited Continuation）。

实际上在大多时候用的比较多的还是有界续延，因为在 Java 中获取整个程序的续延还是比较困难的，这需要全用 CPS 的写法。

## 异常

拿到了有界续延我们就能实现一大堆控制流魔法，这里拿异常处理举个例子，通过CPS写法自己实现一个 `try-throw` 。

首先最基本的想法是把每次调用 `try` 的 `catch` 函数保存起来，由于 `try` 可层层嵌套所以每次压入栈中，然后 `throw` 的时候将最近的 `catch` 函数取出来调用即可：

```java
Stack<Consumer<Exception>> cs = 
    new Stack<>();

void Try(
        Consumer<Runnable> body,
        BiConsumer<Exception, Runnable> 
                  handler,
        Runnable cont) {
    
    cs.push(e -> handler.accept(e, cont));
    body.accept(cont);
    cs.pop();
}

void Throw(Exception e) {
    cs.peek().accept(e);
}
```

这里 `body` 、 `Try` 、 `handler` 的最后一个参数都是这个程序的有界续延。

有了 `try-throw` 就可以按照CPS风格调用它们来达到处理异常的目的：

```java
void test(int t) {
    Try(
    cont -> {
        System.out.println("try");
        if (t == 0) Throw(
            new ArithmeticException());
        else {
            System.out.println(100 / t);
            cont.run();
        }
    },
    (e, cont) -> {
        System.out.println("catch");
        cont.run();
    },
    () -> System.out.println("final"));
}
```

调用 `test(0)` 会得到：

```
try
catch
final
```

而调用 `test(1)` 会得到：

```
try
100
final
```





