# 十分钟魔法练习：求值策略

### By 「玩火」

> 前置技能：Java基础，λ演算

## 非严格求值

细心的读者应该已经注意到， λ 演算那期中讲到的 λ 演算解释器的 `reduce` 并不会先将参数 `reduce` ，而是先 `apply` 参数再在最后 `reduce` 结果：

```java
// class App
public Expr reduce() {
    Expr fr = f.reduce();
    if (fr instanceof Fun) {
        Fun fun = (Fun) fr;
        return fun.e.apply(fun.x, x).reduce();
    }
    return new App(fr, x);
}
```

并且函数的 `reduce` 并不会 `reduce` 函数内部表达式而是直接返回 `this` 。

这样处理和平时见过的常规语言似乎很不一样，C、Java在处理函数参数时都选择先对参数求值再传参。

像这样先传参再归约的求值思路就叫非严格求值（Non-strict Evaluation），也叫惰性求值（Lazy Evaluation）。其最大好处是在很多时候函数的参数没有被使用过的情况下节省了求值时归约次数。

比如 `(λ x. λ y. x) complex1 complex2` 这个 λ 表达式只会取 `complex1` 和 `complex2` 中的 `complex1` ，如果 `complex2` 非常复杂那就非常浪费算力了。

## 严格求值

所谓严格求值（Strict Evaluation）就是像 C 系语言一样先求参数的值再传参：

```java
// class App
public Expr strictReduce() {
    Expr fr = f.strictReduce();
    Expr xr = x.strictReduce();
    if (fr instanceof Fun) {
        Fun fun = (Fun) fr;
        return fun.e.apply(fun.x, xr).strictReduce();
    }
    return new App(fr, xr);
}
```

λ 演算中所有的表达式都是**纯**的，也就是说不同的求值策略和求值顺序并不会影响最终求值的结果。所以不同的求值策略求出的结果都是等价的，只是打印出来的效果不同。这与 C 系语言就很不一样。

## 完全 β 归约

如果想要让打印出的表达式被化到最简还需要在严格求值的基础上把函数定义中的表达式也进一步归约：

```java
// class Fun
public Expr fullBetaReduce() {
    return new Fun(x, e.fullBetaReduce());
}
```

这就是完全 β 归约。它会将任何能归约的地方归约，即使这个函数并没有被应用函数内部也会被归约。

## 对比

对于λ表达式：

````
(λ n. λ f. λ x. (f (n f x)) (λ f. λ x. x))
````

进行非严格求值会得到：

```
λ f. λ x. f ((λ f. λ x. x) f x)
```

进行完全β归约会得到：

```
λ f. λ x. f x
```





