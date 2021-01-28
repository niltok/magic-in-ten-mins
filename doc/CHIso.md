# 十分钟魔法练习：Curry-Howard 同构

### By 「玩火」

> 前置技能：构造演算

## 记忆碎片

我初中刚学几何证明的时候想过一个问题，能否用计算机来自动批改证明。那时候我还在用 VB 语言，能想到的办法也就只有字符串匹配替换。比如说下面的证明：

```
已知: a ∥ b, c ∥ d, a ∦ d 
求证: b ∦ c
∵ a ∥ b
   a ∦ d
∴ b ∦ d
∵ c ∥ d
∴ b ∦ c
```

可以用下面的语法来表示：

```
known: parallel(a, b), parallel(c, d), !parallel(a, d)
// 已知 ⇒ 结论
{ parallel(a, b), !parallel(a, d) } ⇒ { !parallel(b, d) }
{ parallel(c, d), !parallel(b, d) } ⇒ { !parallel(b, c) }
```

然后对每一步证明遍历一遍公理和已知然后进行匹配。这样当然很低效，匹配证据的顺序的时间复杂度是指数级的，如果每次手动提供依据就可以大大提高效率，比如改成下面的表示法：

```
// 公理
Axiom parallelAxiom { parallel ( a, b ), !parallel ( a, c ) } ⇒ !parallel ( b, c )
Axiom sym { parallel ( a, b ) } ⇒ parallel ( b, a )
// 证明
parallelogram { p: parallel ( a, b ), 
                q: parallel ( c, d ), 
                r: !parallel ( a, d ) } ⇒ !parallel ( b, c )
    = parallelAxiom ( sym ( q ), sym ( parallelAxiom ( p, r ) ) )
```

细想的话实际上 `parallelogram` 的定义有点像是个函数类型： `p, q, r` 三个依据就像是函数的三个参数，指代的三个命题就像是参数的类型，而证据 `parallelAxiom, sym` 的使用就像是函数调用一样，把一系列已知变换成一个结论。而且 `parallelogram` 这个证明同样也可以作为证据被其他证明使用。

## Curry-Howard 同构

> 命题即类型，证明即程序

Curry-Howard 同构（Curry-Howard Isomorphism, 有些范畴人倾向叫它 Curry-Howard Correspondence）指出了程序和证明的相似性：一个命题可以看做一个类型，蕴含可以看做函数类型，全称量词可以看做 `forall` ，否定可以看做没有实例的空类型（Empty Type, Void），析取可以看做和类型，合取可以看做积类型。实际上我们可以按照以上规则将任意证明转化成一段程序，而对程序进行类型检查就是对证明的检查。证明的过程就是利用现有实例构造出指定类型的实例的过程。

利用 Curry-Howard 同构编写的一种类型检查器可以帮助数学家检查证明过程，这样的类型检查器被称为证明辅助器（Proof Assistant）。比较常见的证明辅助器有 Agda, Arend, Coq, Lean, F* 等。一个语言能用作辅助证明，最基本要拥有依赖类型（Dependent Type），例如对于上面的简单证明 `p` 的类型 `parallel ( a, b )` 也会依赖 `a, b` 。不过构造演算的类型系统足够表述上面的证明：

```
parallelAxiom = Axiom (
	(a: Line) → (b: Line) → (c: Line) → 
	parallel a b → !parallel a c → !parallel b c )
sym = Axiom ( 
	(a: Line) → (b: Line) → 
	parallel a b → parallel b a )

parallelogram = 
	(a: Line) ⇒ (b: Line) ⇒ (c: Line) ⇒ (d: Line) ⇒ 
	(p: parallel a b) ⇒ (q: parallel c d) ⇒ (r: !parallel a d) ⇒
	parallelAxiom d b c (sym c d q) (sym b d (parallelAxiom a b d p r))
```

其中 `Axiom` 用于表示公理，公理实际上就是一个包含类型信息的不可计算实例：

```java
class Axiom implements Expr {
    Expr t;
    public Expr reduce() { return this; }
    public Expr fullReduce() { return this; }
    public Expr checkType(Env env) { return t; }
}
```

构造出公理时就默认它是正确的，因为我们获得了对应类型的实例。把命题当成公理非常方便但是滥用公理容易造成大问题，如果不慎引入了一个错误的公理那么整个证明都变得不正确了。