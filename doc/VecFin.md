# 十分钟魔法练习：向量与有限集

### By 「玩火」

> 前置技能：构造演算， ADT ，依赖类型模式匹配

## Into

在构造演算中能构造出许多 Java 中无法表达的数据结构，利用依赖类型（Dependent Type，DT）也就是类型依赖值的特性可以在所依赖的值的层面为类型加上约束，本期用向量和有限集数据结构为例介绍 DT 中的数据结构构造思路。

> 自然数采用以下定义：
>
> ```
> type Nat: *
> | Z: Nat
> | S: Nat → Nat
> ```
>
> 而数字是 Nat 的语法糖，0 就是 Z ，3 就是 S (S (S Z)) 。

## 向量

一个向量就是一个「带有长度信息」的列表：

```
type Vec: * → Nat → *
| Nil: (T: *) → Vec T Z
| Cons: (T: *) → T → (n: Nat) → Vec T n → Vec T (S n)
```

相比列表，向量多了一个当做「计数器」的自然数参数，用来记录向量的长度。构造器 `Nil` 可以得到 0 维度的向量，构造器 `Cons` 可以为 n 维向量添加一项变成 n + 1 维的向量。比如说坐标 `(1, 3, 5)` 就可以用 

``` 
Cons Nat 1 2 (
Cons Nat 3 1 (
Cons Nat 5 0 (
Nil Nat)))
```

来表示。一个应用的例子，在向量上的 `map` ：

```
map = λ A: *. λ B: *. λ f: A → B. 
	μ self: (n: Nat) → Vec A n → Vec B n. 
	λ n: Nat. λ v: Vec A n.
	match v (Vec B n)
	| Nil  _        → Nil B
	| Cons _ x m xs → Cons B (f x) m (self m xs) 
```

## 有限集

一个 N 有限集就是范围为 0 到 N - 1 的整数集合，定义如下：

```
type Fin: Nat → *
| FZ: (n: Nat) → Fin (S n)
| FS: (n: Nat) → Fin n → Fin (S n)
```

非常奇怪，对吧。举个例子感受一下，对于 `Fin 3` 只有以下三个合法实例，正好能表示 {0, 1, 2} 这个有限集：

```
0 => FZ 2
1 => FS 2 (FZ 1)
2 => FS 2 (FS 1 (FZ 0))
```

也就是说 `Fin` 的参数设定了嵌套的最大层数，每嵌套一层 `FS` 内层的参数减小一，而嵌套的层数就编码了表示的数这样就能限制取到的最大值。