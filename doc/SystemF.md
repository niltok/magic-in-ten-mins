# 十分钟魔法练习：系统 F

### By 「玩火」

> 前置技能：Java 基础，ADT，简单类型 λ 演算

简单类型 λ 演算的类型系统非常简单，比常见的 C++, Java 语言的类型系统表现力差远了。而如果往简单类型 λ 演算的表达式中加入类型函数定义和类型函数应用来联系类型和表达式就可以大大增强其表现力，这样的类型系统被称为系统 F （System F）。

类型函数定义 `Λ t. E` 定义了一个类型变量 `t` ，可以在表达式 `E` 中使用，其类型是 `∀ t. [Typeof(E)]` 。

类型函数应用 `F T` 类似于函数应用，当 `F` 的类型为 `∀ t. E` 时 `F T` 的类型是 `E(t → T)` ，也就是 `E` 中所有自由的 `t` 被替换为 `T` 。  

比如 `true` 的定义可以写成：

```
true = Λ a. λ (x: a). λ (y: a). (x: a)
```

其类型是：

```
∀ a. a → a → a
```

这就有点类似 Java 中的泛型：

```java
<A> A True(A x, A y) {
    return x;
}
```

而类型函数应用就像是给函数填入泛型参数的类型，像这样：

```
Λ x. true x
```

会得到 `true` 本身。

表达式中加入了新东西那么显然类型系统也需要有一些改变，系统 F 的类型系统由类型变量 `x` ，类型函数 `∀ t. E` ，函数类型 `a → b` 构成：

```java
interface Type {}
class TVal implements Type {
    String x;
    public String toString() {
        return x;
    }
}
class TFun implements Type {
    String x;
    Type e;
    public String toString() {
        return "(∀ " + x + ". " + e + ")";
    }
}
// 对应简单类型 λ 演算中的 FunT
class TArr implements Type {
    Type a, b;
    public String toString() {
        return "(" + a + " → " + b + ")";
    }
}
```

既然有类型函数那就需要有类似函数应用的操作来填入类型参数：

```java
interface Type {
    Type apply(String x, Type t);
}
class TVal implements Type {
    String x;
    public Type apply(String x, Type t) {
        if (this.x.equals(x)) return t;
        else return this;
    }
}
class TFun implements Type {
    String x;
    Type e;
    public Type apply(String x, Type t) {
        if (this.x.equals(x)) return this;
        else return e.apply(x, t);
    }
}
class TArr implements Type {
    Type a, b;
    public Type apply(String x, Type t) {
        return new TArr(a.apply(x, t), 
                        b.apply(x, t));
    }
}
```

再在简单类型 λ 演算的基础上给表达式加上类型函数定义和类型函数应用：

```java
interface Expr {
    Type checkType() throws BadTypeException;
    boolean checkApply(Val v);
}
class Val implements Expr { /* ... */ }
class Fun implements Expr { /* ... */ }
class App implements Expr { /* ... */ }
// 类型函数定义
class Forall implements Expr {
    String x;
    Expr e;
    public Type checkType() 
        	throws BadTypeException {
        return new TFun(x, e.checkType());
    }
    public boolean checkApply(Val v) {
        return e.checkApply(v);
    }
}
// 类型函数应用
class TApp implements Expr {
    Expr e;
    Type t;
    public Type checkType() 
        	throws BadTypeException {
        Type te = e.checkType();
        if (te instanceof TFun) // 填入类型参数
            return ((TFun) te).e
                   .apply(((TFun) te).x, t);
        throw new BadTypeException();
    }
    public boolean checkApply(Val v) {
        return e.checkApply(v);
    }
}
```

其中 `Val`, `Fun`, `App` 的定义和简单类型 λ 演算中基本一致，这里不作展示。

而测试代码

```java
public interface SystemF {
    Expr T = new Forall("a", new Fun(
        new Val("x", new TVal("a")),
        new Fun(new Val("y", new TVal("a")),
            new Val("x", new TVal("a")))));
    Expr F = new Forall("a", new Fun(
        new Val("x", new TVal("a")),
        new Fun(new Val("y", new TVal("a")),
            new Val("y", new TVal("a")))));
    Type Bool = new TFun("x", new TArr(
        new TVal("x"),
        new TArr(new TVal("x"), new TVal("x"))));
    Expr IF = new Forall("a", new Fun(
        new Val("b", Bool),
        new Fun(new Val("x", new TVal("a")), new Fun(
            new Val("y", new TVal("a")),
            new App(new App(
                new TApp(new Val("b", Bool), new TVal("a")),
                new Val("x", new TVal("a"))),
                new Val("y", new TVal("a")))))));
    static void main(String[] args) throws BadTypeException {
        System.out.println(T.checkType());
        System.out.println(IF.checkType());
    }
}
```

运行会输出：

```
(∀ a. (a → (a → a)))
(∀ a. ((∀ x. (x → (x → x))) → (a → (a → a))))
```

