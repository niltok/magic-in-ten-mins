# 十分钟魔法练习：单位半群

### By 「玩火」

> 前置技能：Java基础

## 半群（Semigroup）

半群是一种代数结构，在集合 `A` 上包含一个将两个 `A` 的元素映射到 `A` 上的运算即 `<> : (A, A) -> A​` ，同时该运算满足**结合律**即 `(a <> b) <> c == a <> (b <> c)` ，那么代数结构 `{<>, A}` 就是一个半群。

比如在自然数集上的加法或者减法可以构成一个半群，再比如字符串集上字符串的连接构成一个半群。

## 单位半群（Monoid）

单位半群是一种带单位元的半群，对于集合 `A` 上的半群 `{<>, A}` ， `A` 中的元素 `a` 使 `A` 中的所有元素 `x` 满足 `x <> a` 和 `a <> x` 都等于 `x`，则 `a` 就是 `{<>, A}` 上的单位元。

举个例子， `{+, 自然数集}` 的单位元就是 0 ， `{*, 自然数集}` 的单位元就是 1 ， `{+, 字符串集}` 的单位元就是空串 `""` 。

用 Java 代码可以表示为：

```java
interface Monoid<T> {
    T empty();
    T append(T a, T b);
    default T appends(Stream<T> x) {
        return x.reduce(empty(), this::append);
    }
}
```

## 应用：Optional

在 Java8 中有个新的类 `Optional` 可以用来表示可能有值的类型，而我们可以对它定义个 Monoid ：

```java
class OptionalM<T> implements Monoid<Optional<T>> {
    public Optional<T> empty() {
        return Optional<T>.empty();
    }
    public Optional<T> 
    append(Optional<T> a, Optional<T> b) {
        if (a.isPresent()) return a;
        else return b;
    }
}
```

这样对于 appends 来说我们将获得一串 Optional 中第一个不为空的值，对于需要进行一连串尝试操作可以这样写：

```java
new OptionalM<int>.appends(Stream.of(try1(), try2(), try3(), try4()))
```

## 应用：Ordering

对于 `Comparable` 接口可以构造出：

```java
class OrderingM implements Monoid<int> {
    public int empty() { return 0; }
    public int append(int a, int b) {
        if (a == 0) return b;
        else return a;
    }
}
```

同样如果有一串带有优先级的比较操作就可以用 appends 串起来，比如：

```java
class Student implements Comparable {
    String name;
    String sex;
    Date birthday;
    String from;
    public int compareTo(Object o) {
        Student s = (Student)(o);
        return new OrderingM.appends(Stream.of(
            name.compareTo(s.name),
            sex.compareTo(s.sex),
            birthday.compareTo(s.birthday),
            from.compareTo(s.from)
        ));
    }
}
```

这样的写法比一连串 `if-else` 优雅太多。

## 扩展

在 Monoid 接口里面加 default 方法可以支持更多方便的操作：

```java
interface Monoid<T> {
    //...
    default T when(boolean c, T then) {
        if (c) return then;
        else return empty();
    }
    default T cond(boolean c, T then, T els) {
        if (c) return then;
        else return els;
    }
}

class Todo implements Monoid<Runnable> {
    public Runnable empty() {
        return () -> {};
    }
    public Runnable 
    append(Runnable a, Runnable b) {
        return () -> { a(); b(); };
    }
}
```

然后就可以像下面这样使用上面的定义:

```java
new Todo.appends(Stream.of(
    logic1,
    () -> { logic2(); },
    Todo.when(condition1, logic3)
))
```

> 注：上面的 Optional 并不是 lazy 的，实际运用中加上非空短路能提高效率。