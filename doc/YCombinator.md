# 十分钟魔法练习：Y 组合子

### By 「玩火」

> 前置技能：Java 基础，λ 演算，λ 演算编码

## 递归

在 Java 里面实现递归非常简单，只需要在函数内调用函数本身就好了，比如下面的求和程序：

```java
int sum(int n) {
    if (n == 0) return 0;
    else return n + sum(n - 1);
}
```

这时候就会注意到看起来递归必须要函数有名字，不然怎么调用时表示自己呢？实际上有个很显然的例子：

```
(λ x. x x) (λ x. x x)
```

这个表达式无论怎么求值都会得到它自身，实际上这就是个无限递归的例子。而在它的基础上稍加修改就可以得到 Y 组合子（Y Combinator）：

```
Y = λ f. (λ x. f (x x)) (λ x. f (x x))
```

而往 Y 组合子上应用一个函数就会得到：

```
Y g = (λ x. g (x x)) (λ x. g (x x))
    = g ((λ x. g (x x)) (λ x. g (x x)))
    = g (Y g)
```

这样 `g` 就拿到了 `Y g` 也就是它自己的函数作为参数，那么就可以递归了，比如上面的 `sum` 就可以写成：

```
sum' = λ self. λ n.
	isZero n
		n
		(+ n (self (prev n)))
sum = Y sum'
```

`n` 是个丘奇数， `isZero` 判断数字是不是 0 并得到一个 λ 演算编码的布尔值， `+` 函数把两个丘奇数相加， `prev` 函数得到比 `n` 小一的数。 `sum` 在递归到 `n` 为 0 时停止递归。

## 求值策略

很显然如果直接使用严格求值会无限展开 Y 算子而得不到结果，如果使用惰性求值会得不到易于阅读的结果。这时候就要用一种介于两者之间的求值策略：

```java
// class Fun
public Expr fullReduce() {
    return new Fun(x, e.fullReduce());
}
// class App
public Expr fullReduce() {
    Expr fr = f.reduce();
    if (fr instanceof Fun) {
        Fun fun = (Fun) fr;
        return fun.e.apply(fun.x, x).fullReduce();
    }
    return new App(fr.fullReduce(), x.fullReduce());
}
```

它只有在尝试应用函数失败的时候才会进行完全展开，这样每次只展开一点就可以避免陷入无限递归。

## 循环

在编码那期中介绍了如何在 λ 演算中构造分支结构，而循环循环可以用递归来表示，每个循环都可以写成循环变量作为参数的尾递归函数，实际上如下的循环：

```java
State state;
while (needLoop(state)) {
    doSomething();
    state = update(state);
}
```

都可以写成如下的递归函数：

```java
State While(State state) {
    if (needLoop(state)) 
        return While(update(state));
    else return state;
}
```

这样就可以把任意的循环改写成 λ 演算的形式了。

