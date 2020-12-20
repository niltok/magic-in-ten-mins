# 十分钟魔法练习：构造演算

### By 「玩火」

> 前置技能：Java 基础，ADT，系统 F ω

## λ 立方

表达式非类型部分叫做项（Term），类型部分叫做类型（Type），其中项的类型为类型也写作 `*` 而类型的类型也就是种类（Kind）写作 `□`。简单类型 λ 演算中项和类型是分离的，其中只有针对项的函数，它接收一个项返回另一个项，其类型是 `* → *` 。系统 F 对类型系统进行了扩充，在项中增加了一种函数，接收一个类型返回一个项，其类型是 `□ → *` 。而系统 F ω 进一步增加了接收类型返回类型的函数，也就是 `□ → □` 。那么可以想象应该还存在一类函数接收一个值产生一个类型，其类型应该是 `* → □` 。

对于所有 λ 演算都存在 `* → *` 的函数，而另外三种不同函数是三种额外的特性，可以自由组合来构造新的类型系统，一共能组合出六种不同的类型系统：

```
    ω ------ C
  / |      / |
2 ------ P2  |
|   _ω --|- _Pω
| /      | /
→ ------ P
```

左下角的 λ→ 就是简单类型 λ 演算，和它相连的三条边对应在其基础上分别添加了三种不同函数的 λ 演算。 λ2 就是系统 F ，包含 `□ → *` 函数。 λ<u>ω</u> 就是去除了系统 F 对应特性的系统 F ω ，也叫系统 F <u>ω</u> 。右下的 λP 就是在简单类型 λ 中加入了 `* → □` 的 λ 演算，而这样的类型系统中类型依赖值所以也叫依赖类型系统（Dependent Type System），在 C++ 中模板可以有值参数所以实际上 C++ 的类型系统中包括依赖类型（Dependent Type）。

这个立方体就被称为 λ 立方（Lambda Cube）。

## 构造演算

在 λ 立方的顶端放着 λC ，也叫构造演算（Calculus of Construction, CoC）。在构造演算中类型可以作为函数的输入，也可以作为函数的输出，那么实际上我们可以把项和函数作为相同的东西，不再加以区分。这样四种不同的函数也可以不加以区分放在一起，同时加入类别（Sort）来表达类型和类型的类型。而且因为 `A → B` 等价于 `∀ _: A. B` ，那么系统 F ω 中的 `TForall` 和 `TArr` 也可以合并。这样 CoC 的语法树表示如下：

```java
interface Expr {
    Expr genUUID();
    void applyUUID(Val v);

    Expr reduce();
    Expr fullReduce();
    Expr apply(Val v, Expr e);

    Expr checkType() throws BadTypeException;
    boolean checkApply(Val v);
}
class Sort implements Expr {
    int x; // 1 为 * ， 2 为 □
}
class Val implements Expr {
    String x;
    UUID id;
    Expr t; // 类型
}
class Fun implements Expr {
    Val x;
    Expr e;
}
class App implements Expr {
    Expr f, x;
}
// Forall, Arrow
class Pi implements Expr {
    Val x;
    Expr e;
}
```

其中 `Expr` 的接口的函数被分成了三组，第一组是预生成 `id` 只需要简单递归生成就可以，之前也展示过；第二组是对表达式的化简，只需注意 `App` 在化简时只应用 `Fun` 应该忽略 `Pi` ，并且递归化简时别忘了变量部分的类型也是一个表达式；第三组就是类型检查部分了， `Fun` 的类型是 `Pi` ， `Pi` 的类型是 `e` 的类型， `App` 把表达式应用到 `Pi` 上：

```java
class Sort implements Expr {
    public Expr checkType() {
        return new Sort(x + 1);
    }
    public boolean checkApply(Val v) {
        return true;
    }
}

class Val implements Expr {
    public Expr checkType() {
        return t.fullReduce();
    }
    public boolean checkApply(Val v) {
        if (equals(v))
            return checkType().equals(v.checkType());
        return t.checkApply(v);
    }
}

class Fun implements Expr {
    public Expr checkType() throws BadTypeException {
        Expr pi = new Pi(x, e.checkType());
        if (pi.checkType() instanceof Sort)
            return pi;
        throw new BadTypeException();
    }
    public boolean checkApply(Val v) {
        return x.checkApply(v) &&
                e.checkApply(v);
    }
}

class App implements Expr {
    public Expr checkType() throws BadTypeException {
        Expr tf = f.checkType();
        if (tf instanceof Pi) {
            Pi pi = (Pi) tf;
            if (x.checkType().equals(pi.x.checkType()))
                return pi.e.apply(pi.x, x);
        }
        throw new BadTypeException();
    }
    public boolean checkApply(Val v) {
        return f.checkApply(v) && x.checkApply(v);
    }
}

class Pi implements Expr {
    public Expr checkType() throws BadTypeException {
        Expr ta = x.checkType().checkType(); // x.t 的类型
        Expr tb = e.checkType();
        if (ta instanceof Sort && tb instanceof Sort) {
            return tb;
        }
        throw new BadTypeException();
    }
    public boolean checkApply(Val v) {
        return x.checkApply(v) && e.checkApply(v);
    }
}
```

所以实际上 `Pi` 就是一个类型检查期的标识，并不参与最终值的演算。

这样就构造出了一个相当强大的类型系统，它的表现力已经超越了几乎所有常见语言的类型系统。之后将会介绍如何利用这个强大的类型系统表达复杂的类型，做一些常见类型系统做不到的事情。