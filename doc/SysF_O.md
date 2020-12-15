# 十分钟魔法练习：系统 F <u>ω</u>

### By 「玩火」

> 前置技能：Java 基础，ADT，简单类型 λ 演算

在 Java 和 C# 中有泛型，在 C++ 中有模板，他们都可以让一个类型接受一些类型产生一个类型，比如：

```java
class Just<T> {
    T value;
}
```

`Just` 就是个能接受类型参数 `T` 的类型，它被称为类型构造器（Type Constructor）。在简单类型 λ 演算中加入类型构造器后它被称为系统 F <u>ω</u> （System F <u>ω</u>）。实际上这相当于在类型系统中嵌入了一个完整的 λ 演算解释器，所以我们需要在简单类型 λ 演算的类型系统中加入 `TFun` 和 `TApp` 来定义一个类型构造器和应用一个类型构造器：

```java
interface Type {
    Type reduce();
    Type fullReduce();
    Type apply(TVal v, Type t);
    Type genUUID();
    void applyUUID(TVal v);
}
class TVal implements Type {
    String x;
    UUID id;
}
class TFun implements Type {
    TVal x;
    Type t;
}
class TApp implements Type {
    Type f, x;
}
class TArr implements Type {
    Type a, b;
    public Type reduce() {
        return new TArr(a.reduce(), 
                        b.reduce());
    }
    public Type fullReduce() {
        return new TArr(a.fullReduce(), 
                        b.fullReduce());
    }
    public Type genUUID() {
        a.genUUID();
        b.genUUID();
        return this;
    }
    public void applyUUID(TVal v) {
        a.applyUUID(v);
        b.applyUUID(v);
    }
    public Type apply(TVal v, Type t) {
        return new TArr(a.apply(v, t), 
                        b.apply(v, t));
    }
}
```

其中 `TVal` 、 `TFun` 和 `TApp` 的函数实现和无类型 λ 演算中的表达式基本一致，这里就不贴出展示了。而 `TArr` 的实现也只是简单进行递归调用，非常简单。

而表达式相比简单类型 λ 演算需要的改动是 `TVal` 在检查类型时需要先调用 `fullReduce` 来化简类型：

```java
interface Expr {
    Type checkType() throws BadTypeException;
    boolean checkApply(Val v);
    Expr genUUID();
    void applyUUID(TVal v);
}
class Val implements Expr {
    String x;
    Type t;
    public Type checkType() {
        return t.fullReduce();
    }
    public boolean checkApply(Val v) {
        if (x.equals(v.x))
            return t.fullReduce()
                   .equals(v.t.fullReduce());
        return true;
    }
}
class Fun implements Expr {
    Val x;
    Expr e;
}
class App implements Expr {
    Expr f, x;
}
```

实际上系统 F <u>ω</u> 单独拿出来是个比较弱的类型系统，但如果和其他特性的类型系统相结合可以变成表达能力很强的类型系统、