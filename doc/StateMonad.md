# 十分钟魔法练习：状态单子

### By 「玩火」

> 前置技能：Java基础，HKT，Monad

## 函数容器

很显然Java标准库中的各类容器都是可以看成是单子的， `Stream` 类也给出了这些类的 `flatMap` 实现。不过在函数式的理论中单子不仅仅可以是实例意义上的容器，也可以是其他抽象意义上的容器，比如函数。

对于一个形如` Function<S, Complex<A>>` 形式的函数来说，我们可以把它看成包含了一个 `A` 的惰性容器，只有在给出 `S` 的时候才能知道 `A` 的值。对于这样形式的函数我们同样能写出对应的 `flatMap` ，这里就拿状态单子举例子。

## 状态单子

状态单子（State Monad）是一种可以包含一个“可变”状态的单子，我这里用了引号是因为尽管状态随着逻辑流在变化但是在内存里面实际上都是不变量。

其本质就是在每次状态变化的时候将新状态作为代表接下来逻辑的函数的输入。比如对于：

```java
i = i + 1;
System.out.println(i);
```

可以用状态单子的思路改写成：

```java
(v -> System.out.println(v)).apply(i + 1);
```

最简单的理解就是这样的一个包含函数的对象：

```java
class State<S, A> 
    implements HKT<State<S, ?>, A> {
    
    Function<S, StateData<A, S>> runState;
    
    // Pair alias
    static class StateData<A, S> {
        S state;
        A value;
        StateData(A v, S s) {
            state = s;
            value = v;
        }
    }
    
    // Constructor
    State(Function<S, 
          StateData<A, S>> f) { 
        runState = f; 
    }
    
    // Transformer
    static <S, A> State<S, A>
    narrow(HKT<State<S, ?>, A> v) {
        return (State<S, A>) v;
    }
}
```

这里为了好看定义了一个 `StateData` 类，包含变化后的状态和计算结果。而最核心的就是 `runState` 函数对象，通过组合这个函数对象来使变化的状态在逻辑间传递。

`State` 是一个 Monad （注释中是简化的伪代码）：

```java
class StateM<S> 
    implements Monad<State<S, ?>> {
    
    public <A> HKT<State<S, ?>, A> 
    pure(A v) {
        return new State<>(s -> 
            new State.StateData<>(v, s));
    }
    
    // <A, B> State<S, B> 
    // flatMap(State<S, A> ma, 
    //     Function<A, State<S, B> f)
    public <A, B> HKT<State<S, ?>, B>
    flatMap(HKT<State<S, ?>, A> ma, 
        Function<A,
            HKT<State<S, ?>, B>> f) {
        
        return new State<>(s -> {
            
            // r = ma.runState(s)
            State.StateData<A, S> r = 
                State
                .narrow(ma)
                .runState
                .apply(s);
            
            // return f(r.value)
            //     .runState(r.state)
            return State
                .narrow(f.apply(r.value))
                .runState
                .apply(r.state);
        });
    }
}

```

`pure` 操作直接返回当前状态和给定的值， `flatMap` 操作只需要把 `ma` 中的 `A` 取出来然后传给 `f` ，并处理好 `state` 。

仅仅这样的话 `State` 使用起来并不方便，还需要定义一些常用的操作来读取写入状态：

```java
// class StateM<S>
// 读取
HKT<State<S, ?>, S> get = 
    new State<>(s -> 
        new State.StateData<>(s, s));
// 写入
HKT<State<S, ?>, S> put(S s) {
    return new State<>(any -> 
        new State.StateData<>(any, s));
}
// 修改
HKT<State<S, ?>, S> 
modify(Function<S, S> f) {
    return new State<>(s -> 
        new State.StateData<>(
            s, 
            f.apply(s)));
}
```

使用的话这里举个求斐波那契数列的例子：

```java
static 
State<Pair<Integer, Integer>, Integer> 
fib(Integer n) {
    StateM<Pair<Integer, Integer>> m = 
        new StateM<>();
    if (n == 0) return State.narrow(
             m.flatMap(m.get,
        x -> m.pure(x.second)));
    
    return State.narrow(
             m.flatMap(m.modify(x -> 
                 new Pair<>(x.second, 
                     x.first + x.second)),
        v -> fib(n - 1))
    );
}
public static void main(String[] args) {
    System.out.println(
        fib(7)
        .runState
        .apply(new Pair<>(0, 1))
        .value);
}
```

`fib` 函数对应的 Haskell 代码是：

```haskell
fib :: Int -> State (Int, Int) Int
fib 0 = do
  (_, x) <- get
  pure x
fib n = do
  modify (\(a, b) -> (b, a + b))
  fib (n - 1)
```

~~看上去比 Java 版简单很多~~

## 有啥用

看到这里肯定有人会拍桌而起：求斐波那契数列我有更简单的写法！

```java
static int fib(int n) {
    int[] a = {0, 1, 1};
    for (int i = 0; i < n; i++)
        a[(i + 2) % 3] = a[(i + 1) % 3] + 
                         a[i % 3];
    return a[(n + 1) % 3];
}
```

但问题是你用变量了啊， `State Monad` 最妙的一点就是全程都是常量而模拟出了变量的感觉。

更何况你这里用了数组而不是在递归，如果你递归就会需要在 `fib` 上加一个状态参数， `State Monad` 可以做到在不添加任何函数参数的情况下在函数之间传递参数。

同时它还是纯的，也就是说是**可组合**的，把任意两个状态类型相同的 `State Monad` 组合起来并不会有任何问题，比全局变量的解决方案不知道高到哪里去。



