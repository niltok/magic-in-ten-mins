# 十分钟魔法练习： μ

### By 「玩火」

> 前置技能：Java 基础，构造演算， Y 组合子

## Y 组合子的类型

Y 组合子在无类型 λ 演算中是这样定义的

```
Y = λ f. (λ x. f (x x)) (λ x. f (x x))
```

但是它的类型是什么呢？实际上我们可以构造如下式子来分析：

```
Y f = f (Y f)
```

假设 `f` 的类型为 `A` ， `Y` 的类型为 `A → B` ，那么 `Y f` 的类型就是 `B` ，所以等式右边的类型也应该为 `B` ，那么 `f` 的类型就应当是 `A = B → B` ，解得 `Y` 的类型为 `(B → B) → B` 。这就解得了 Y 组合子的宏观上的类型 `π T: *. (T → T) → T` 。

不过如果想完整地写出 Y 组合子中每个变量的类型就会遇到困难， `x` 的类型是什么呢？如果假设 `x` 的类型是 `A → B` 那么考虑到存在 `x x` 这样的结构， `A` 应该就是 `A → B` ，但这样又回到了最开始的问题，假设 `x` 的类型是 `(A → B) → B` 。显然这样最后并不收敛， `x` 的类型没有解。

既然 Y 组合子中有些变量的类型无法解出那么实际上在 Lambda Cube 中的各个类型系统都是无法构造 Y 组合子的，这就意味着这些类型系统没有办法递归，而通过这些类型系统检查的程序是一定会停机的。换句话说其实这些演算是不图灵完备的。

## μ

所以实际上虽然看上去类似 Y 的不动点组合子是存在的但是无法给出具体实现，这时候就需要在构造演算中开个洞来获得不动点组合子。在表达式中增加 `μ x: A. e` 的结构，等价于 `Y (λ x: A. e)` ，注意 `Y` 的类型是 `(A → A) → A`  ，而对应的 `λ x: A. e` 的类型是 `A → A` ，也就是说 `e` 的类型是 `A` 。调用 `μ` 的 `reduce` 得到 `e[x → μ x: A. e]` 。

```java
class Mu implements Expr {
    Val x;
    Expr e;
    
    Expr open() { // unfold
        return e.apply(x, this);
    }

    public Expr reduce() {
        return this;
    }

    public Expr fullReduce() {
        return this;
    }

    public Expr checkType(Env env) throws BadTypeException {
        Pi pi = new Pi(x, e.checkType(new ConsEnv(x, env)));
        if (pi.checkType(env) instanceof Sort &&
                pi.e.fullReduce().equals(pi.x.t.fullReduce()))
            return pi.e;
        throw new BadTypeException();
    }
    
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        if (getClass() != e.getClass()) 
            return Objects.equals(open(), e);
        //         ^^^^^^^^^^^^^^^^^^^^^^^^^
        Mu mu = (Mu) o;
        return Objects.equals(e.apply(x, mu.x), mu.e);
        //                    ^^^^^^^^^^^^^^^^
    }
}
```

注意在比较的时候如果类型不一致需要尝试展开再继续比较，而且对于其他所有的表达式元素在比较时都需要对 μ 特殊处理，这里拿 `Fun` 举个例子：

```java
class Fun implements Expr {
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        // Or:                      equals(((Mu) o).open())
        if (o instanceof Mu) return o.equals(this);
        //  ^^^^^^^^^^^^^^^         ^^^^^^^^^^^^^^
        if (getClass() != o.getClass()) return false;
        Fun fun = (Fun) o;
        return Objects.equals(e, fun.e.apply(fun.x, x));
    }
}
```

在 `App` 中碰到 μ 也要展开一下：

```java
class App implements Expr {
    public Expr reduce() {
        Expr fr = f.reduce();
        if (fr instanceof Mu) fr = ((Mu) fr).open();
        //  ^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^
        if (fr instanceof Fun) {
            Fun fun = (Fun) fr;
            return fun.e.apply(fun.x, x).reduce();
        }
        return new App(fr.reduce(), x.reduce());
    }

    public Expr fullReduce() {
        Expr fr = f.reduce();
        if (fr instanceof Mu) fr = ((Mu) fr).open();
        //  ^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^
        if (fr instanceof Fun) {
            Fun fun = (Fun) fr;
            return fun.e.apply(fun.x, x).fullReduce();
        }
        return new App(fr.fullReduce(), x.fullReduce());
    }

    public Expr checkType(Env env) throws BadTypeException {
        Expr tf = f.checkType(env).fullReduce();
        if (tf instanceof Mu) tf = ((Mu) tf).open();
        //  ^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^
        if (tf instanceof Pi) {
            Pi pi = (Pi) tf;
            if (x.checkType(env).fullReduce().equals(pi.x.checkType(env).fullReduce()))
                return pi.e.apply(pi.x, x);
        }
        throw new BadTypeException();
    }
}
```

μ 只在使用的时候才会展开一次，这是为了防止出现求值时无限递归的情况。

> 实际上 μ 这个东西只是用来处理类型的，但是 CoC 里面不区分类型和项所以这里也用于项的递归了。



