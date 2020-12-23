# 十分钟魔法练习：系统 F ω

### By 「玩火」

> 前置技能：Java 基础，ADT，系统 F

在 Java 和 C# 中有泛型，在 C++ 中有模板，他们都可以让一个类型接受一些类型产生一个类型，比如：

```java
class Just<T> {
    T value;
}
```

`Just` 就是个能接受类型参数 `T` 的类型，它被称为类型构造器（Type Constructor）。在系统 F 中加入类型构造器后它被称为系统 F ω （System F ω）。加入了类型构造器后就可以在 λ 演算中构造泛型容器了，比如构造泛型的 List 。

实际上这相当于在类型系统中嵌入了一个完整的 λ 演算解释器，所以我们需要在系统 F 的类型系统中加入 `TFun` 来定义一个类型函数 `TApp` 来应用一个类型函数：

```java
interface Type {
    Type reduce();
    Type fullReduce();
    Type apply(TVal v, Type t);
    Type genUUID();
    Type applyUUID(TVal v);
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
class TForall implements Type {
    TVal x;
    Type t;
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
    public Type apply(TVal v, Type t) {
        return new TArr(a.apply(v, t), 
                        b.apply(v, t));
    }
}
```

其中 `TVal` 、 `TFun` 和 `TApp` 的函数实现和无类型 λ 演算中的表达式基本一致，不过注意要加上 `equals` 函数的实现，并且 `TFun` 在比较前需要把变量替换成一样的， `fullReduce` 函数在 Y 组合子那期中给出了实现，这里就不贴出展示了。而 `TForall` 的实现可以参考 System F ， `TArr` 的实现也只是简单进行递归调用，非常简单。

而表达式相比系统 F 需要的改动是 `TVal` 在检查类型时需要先调用 `fullReduce` 来化简类型：

```java
interface Expr {
    Type checkType() throws BadTypeException;
    boolean checkApply(Val v);
    Expr genUUID();
    Expr applyUUID(TVal v);
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
    public Type checkType() 
        	throws BadTypeException {
        if (e.checkApply(x)) 
            return new TArr(x.checkType(), 
                            e.checkType());
        throw new BadTypeException();
    }
}
class App implements Expr {
    Expr f, x;
}
class Forall implements Expr {
    TVal x;
    Expr e;
}
class AppT implements Expr {
    Expr e;
    Type t;
}
```

有了类型构造器，我们就可以表达带有泛型的容器，比如列表（建议只看注释）：

```java
public interface TypeCons {
    // List = λ X. ∀ R. (X → (R → R)) → (R → R)
    Type List = new TFun("X", new TForall("R", new TArr(
        new TArr(new TVal("X"), new TArr(new TVal("R"), new TVal("R"))),
        new TArr(new TVal("R"), new TVal("R"))))).genUUID();
    // nil  = Λ X. (Λ R. λ c: X → (R → R). λ n: R. n)
    Expr nil = new Forall("X", new Forall("R", new Fun(
        new Val("c", new TArr(new TVal("X"), new TArr(new TVal("R"), new TVal("R")))),
        new Fun(new Val("n" , new TVal("R")), new Val("n", new TVal("R")))))).genUUID();
    // cons = Λ X. λ h: X. λ t: List X. (Λ R. λ c: X → R → R. λ n: R. c h (t R c n))
    Expr cons = new Forall("X", new Fun(new Val("h", new TVal("X")), new Fun(
        new Val("t", new TApp(List, new TVal("X"))),
        new Forall("R", new Fun(
            new Val("c", new TArr(new TVal("X"), new TArr(new TVal("R"), new TVal("R")))),
            new Fun(new Val("n", new TVal("R")), new App(
                new App(new Val("c", new TArr(new TVal("X"), new TArr(new TVal("R"), new TVal("R")))),
                    new Val("h", new TVal("X"))),
                new App(new App(new AppT(new Val("t", new TApp(List, new TVal("X"))), new TVal("R")),
                    new Val("c", new TArr(new TVal("X"), new TArr(new TVal("R"), new TVal("R"))))),
                    new Val("n", new TVal("R")))))))))).genUUID();
    static void main(String[] args) 
        	throws BadTypeException {
        // (∀ X. (∀ R. ((X → (R → R)) → (R → R))))
        System.out.println(nil.checkType());
        // (∀ X. (X → ((∀ R. ((X → (R → R)) → (R → R))) → (∀ R. ((X → (R → R)) → (R → R))))))
        System.out.println(cons.checkType());
    }
}
```

这个列表的构造类似于自然数，每次在原列表的外面套一层来增加一项。

注意上面的类型系统中是个无类型的 λ 演算，实际上类型也是可以拥有类型的，被称为种类（Kind）。基础类型和函数类型的种类是 `*` ，而类型构造器的种类是 `* → *` 。而为了增强类型检查器的能力我们也可以先进行种类检查，不过这里并没实现。

