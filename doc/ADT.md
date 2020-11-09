# 十分钟魔法练习：代数数据类型

### By 「玩火」

> 前置技能：Java基础

## 积类型（Product type）

积类型是指同时包括多个值的类型，比如Java中的class就会包括多个字段：


```java
public final class Student {
    public String name;
    public int id;
}
```

而上面这段代码中Student的类型中既有String类型的值也有int类型的值，可以表示为String和int的「积」，即`String * int`。

## 和类型（Sum type）

和类型是指可以是某一些类型之一的类型，在Java中可以用继承来表示：

```java
public class SchoolPerson {}
public final class Student extends SchoolPerson {
    public String name;
    public int id;
}
public final class Teacher extends SchoolPerson {
    public String name;
    public String  office;
}
```

SchoolPerson可能是Student也可能是Teacher，可以表示为Student和Teacher的「和」，即`String * int + String * String`。而使用时只需要用`instanceof`就能知道当前的StudentPerson具体是Student还是Teacher。

## 代数数据类型（ADT, Algebraic Data Type）

由和类型与积类型组合构造出的类型就是代数数据类型，其中代数指的就是和与积的操作。

利用和类型的枚举特性与积类型的组合特性，我们可以构造出Java中本来很基础的基础类型，比如枚举布尔的两个量来构造布尔类型：

```java
public class Bool {}
public final class True extends Bool {}
public final class False extends Bool {}
```

然后用`t instanceof True`就可以用来判定t作为Bool的值是不是True。

比如利用S的数量表示的自然数：

```java
public class Nat {}
public final class Z extends Nat {}
public final class S extends Nat {
    public Nat value;
    
    public S(Nat v) { value = v; }
}
```

这里提一下自然数的皮亚诺构造，一个自然数要么是 0(也就是上面的Z) 要么是比它小一的自然数 +1(也就是上面的S) ，例如3可以用`new S(new S(new S(new Z))`来表示。

再比如链表：

```java
public class List<T> {}
public final class Nil<T> extends List<T> {}
public final class Cons<T> extends List<T> {
    public T value;
    public List<T> next;
    
    public Cons(T v, List<T> n) {
        value = v;
        next = n;
    }
}
```

`[1, 3, 4]`就表示为`new Cons(1, new Cons(3, new Cons(4, new Nil)))`

更奇妙的是代数数据类型对应着数据类型可能的实例数量。

很显然积类型的实例数量来自各个字段可能情况的组合也就是各字段实例数量相乘，而和类型的实例数量就是各种可能类型的实例数量之和。

比如Bool的类型是`1+1`而其实例只有True和False，而Nat的类型是`1+1+1+...`其中每一个1都代表一个自然数，至于List的类型就是`1+x(1+x(...))`也就是`1+x^2+x^3...`其中x就是List所存对象的实例数量。

## 实际运用

ADT最适合构造树状的结构，比如解析JSON出的结果需要一个聚合数据结构。

```java
public class JsonValue {}
public final class JsonBool extends JsonValue {
    public boolean value;
}
public final class JsonInt extends JsonValue {
    public int value;
}
public final class JsonString extends JsonValue {
    public String value;
}
public final class JsonArray extends JsonValue {
    public List<JsonValue> value;
}
public final class JsonMap extends JsonValue {
    public Map<String, JsonValue> value;
}
```

> 注1：上面的和类型代码都存在用户可能自己写一个子类的问题，更好的写法应该用Java 14中的sealed interface代替基类。
>
> 注2：上面的写法是基于变量非空假设的，也就是代码中不会出现null，所有变量也不为null。
