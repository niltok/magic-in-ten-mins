# 十分钟魔法练习：单子

### By 「玩火」

> 前置技能：Java基础，HKT

## 单子

单子(Monad)是指一种有一个类型参数的数据结构，拥有 `pure` （也叫 `unit` 或者 `return` ）和 `flatMap` （也叫 `bind` 或者 `>>=` ）两种操作：

```java
interface Monad<M> {
    <A> HKT<M, A> pure(A v);
    
    <A, B> HKT<M, B>
    flatMap(HKT<M, A> ma, 
            Function<A, HKT<M, B>> f);
}
```

其中 `pure` 要求返回一个包含参数类型内容的数据结构， `flatMap` 要求把 `ma` 中的值经过 `f` 以后再串起来。

举个最经典的例子：

## List Monad

```java
class HKTListM implements Monad<HKTList<?>> {
    public <A> HKT<HKTList<?>, A> pure(A v) {
        ArrayList<A> list = new ArrayList<>();
        list.add(v);
        return new HKTList<>(list);
    }
    
    public <A, B> HKT<HKTList<?>, B> 
    flatMap(HKT<HKTList<?>, A> ma, 
           Function<A, HKT<HKTList<?>, B>> f) {
        return HKTList.narrow(ma).value
            .stream().flatMap(v -> 
            	HKTList.narrow(f.apply(v))
                    .value.stream())
            .collect(HKTList.collector());
    }
}
```

简单来说 `pure(v)` 将得到 `{v}` ，而 `flatMap({1, 2, 3}, v -> {v + 1, v + 2})` 将得到 `{2, 3, 3, 4, 4, 5}` 。这都是 Java 里面非常常见的操作了，并没有什么新意。

## Maybe Monad

Java 不是一个空安全的语言，也就是说任何对象类型的变量都有可能为 `null` 。对于一串可能出现空值的逻辑来说，判空常常是件麻烦事：

```java
static Maybe<Integer>
addI(Maybe<Integer> ma, Maybe<Integer> mb) {
    if (ma.value == null) return new Maybe<>();
    if (mb.value == null) return new Maybe<>();
    return new Maybe<>(ma.value + mb.value);
}
```

其中 `Maybe` 是个 `HKT` 的包装类型：

```java
class Maybe<A> implements HKT<Maybe<?>, A> {
    A value;
    Maybe() { value = null; }
    Maybe(A v) { value = v; }
    static <T> Maybe<T> 
    narrow(HKT<Maybe<?>, T> v) {
        return (Maybe<T>) v;
    }
}
```

像这样定义 `Maybe Monad` ：

```java
class MaybeM implements Monad<Maybe<?>> {
    public <A> HKT<Maybe<?>, A> pure(A v) {
        return new Maybe<>(v);
    }
    public <A, B> HKT<Maybe<?>, B>
    flatMap(HKT<Maybe<?>, A> ma, 
            Function<A, HKT<Maybe<?>, B>> f) {
        A v = Maybe.narrow(ma).value;
        if (v == null) return new Maybe<>();
        else return f.apply(v);
    }
}
```

上面 `addI` 的代码就可以改成：

```java
static Maybe<Integer>
addM(Maybe<Integer> ma, Maybe<Integer> mb) {
    MaybeM m = new MaybeM();
    return Maybe.narrow(   // do
        m.flatMap(ma, a -> //   a <- ma
        m.flatMap(mb, b -> //   b <- mb
        m.pure(a + b)))    //   pure (a + b)
    );
}
```

这样看上去就比上面的连续 `if-return` 优雅很多。在一些有语法糖的语言 (`Haskell`) 里面 Monad 的逻辑甚至可以像上面右边的注释一样简单明了。

> 我知道会有人说，啊，我有更简单的写法：
>
> ```java
> static Maybe<Integer>
> addE(Maybe<Integer> ma, 
>      Maybe<Integer> mb) {
>     try { return new Maybe<>(
>             ma.value + mb.value);
>     } catch (Exception e) {
>         return new Maybe<>();
>     }
> }
> ```
>
> 确实，这样写也挺简洁直观的， `Maybe Monad` 在有异常的 Java 里面确实不是一个很好的例子，不过 `Maybe Monad` 确实是在其他没有异常的函数式语言里面最为常见的 Monad 用法之一。而之后我也会介绍一些异常也无能为力的 Monad 用法。
