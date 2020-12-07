# 十分钟魔法练习：简单类型 λ 演算

### By 「玩火」

> 前置技能：Java 基础，ADT，λ 演算

## 简单类型 λ 演算

简单类型 λ 演算（Simply-Typed Lambda Calculus）是在无类型 λ 演算（Untyped Lambda Calculus）的基础上加了个非常简单的类型系统。

这个类型系统包含两种类型结构，一种是内建的基础类型 `T` ，一种是函数类型 `A -> B` ，其中函数类型由源类型 `A` 和目标类型 `B` 组成：

```
Type = BaseType + FunctionType
FunctionType = Type * Type
```

用 Java 代码可以表示为：

```java
// 构造函数， equals 已省去
interface SType {}
class BaseT implements SType {
    final String name;
    public String toString() {
        return name;
    }
}
class FunT implements SType {
    final SType src, tar;
    public String toString() {
        return "(" + src.toString() + " -> " 
                   + tar.toString() + ")";
    }
}
```

## 年轻人的第一个 TypeChecker

然后需把类型嵌入到 λ 演算的语法树中：

```java
// 构造函数， toString 已省去
class STVal implements STExpr {
    String x;
    SType type;
}
class STFun implements STExpr {
    STVal x;
    STExpr e;
}
class STApp implements STExpr {
    STExpr f, x;
}
```

注意只有变量和函数定义的变量需要标记类型，表达式的类型是可以被简单推导出的。

而对于这样简单的模型，类型检查只需要判断 `F X` 中的 `F` 需要是函数类型，并且 `λ x. E` 中 `E` 里所有的 `x` 类型匹配，并且 `(λ x. F) E` 中 `x` 的类型和 `E` 的类型一致。

而类型推导也很简单：变量的类型就是它被标记的类型；函数定义的类型就是以它变量的标记类型为源，它函数体的类型为目标的函数类型；而函数应用的类型就是函数的目标类型，在能通过类型检查的情况下。

以上用 Java 代码描述就是：

```java
// 构造函数， toString 已省去
interface STExpr {
    SType checkType() 
        throws BadTypeException;

    boolean checkApply(STVal val);
}

class STVal implements STExpr {
    String x;
    SType type;

    public SType checkType() {
        return type;
    }

    public boolean checkApply(STVal val) {
        if (x.equals(val.x))
            return type.equals(val.type);
        else return true;
    }
}

class STFun implements STExpr {
    STVal x;
    STExpr e;

    public SType checkType() 
            throws BadTypeException {
        if (e.checkApply(x))
            return new FunT(x.type, 
                            e.checkType());
        else throw new BadTypeException();
    }

    public boolean checkApply(STVal val) {
        if (x.x.equals(val.x)) return true;
        return e.checkApply(val);
    }
}

class STApp implements STExpr {
    STExpr f, x;

    public SType checkType() 
            throws BadTypeException {
        SType tf = f.checkType();
        
        if (tf instanceof FunT &&
                ((FunT) tf).src
                .equals(x.checkType()))
            return ((FunT) tf).tar;
        else throw new BadTypeException();
    }

    public boolean checkApply(STVal val) {
        return f.checkApply(val) 
            && x.checkApply(val);
    }
}
```

下面的测试代码对

 ````
(λ (x: int). (y: bool -> int)) (1: int)
 ````

进行了类型检查，会打印输出 `(bool -> int)` ：

```java
public class STLambda {
    public static void main(String[] args) {
        try {
            System.out.println(new STApp(
                new STFun(
                    new STVal("x", 
                        new BaseT("int")),
                    new STVal("y", new FunT(
                        new BaseT("bool"),
                        new BaseT("int")))),
                new STVal("1", new BaseT("int"))
            ).checkType());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

而如果对

```
(λ (x: int). (x: bool -> int)) (1: int)
```

进行类型检查就会抛出 `BadTypeException` 。