# 十分钟魔法练习：解析器单子

### By 「玩火」

> 前置技能：Java基础，HKT，Monad

解析器（Parser）是编译器的一部分，它读取源代码（Source Code），输出一个抽象语法树（Abstract Syntax Tree, AST）。某种程度上来说，解析器是一种可组合的东西，字符解析器组成了整数解析器，整数解析器组成了浮点数解析器。

这样可组合的解析器有一个抽象的函数表达：

```java
Function<ParseState, 
         Maybe<Pair<A, ParseState>>>
```

其中 `ParseState` 是包含当前解析位置的源文本的类型。返回值用 `Maybe` 包起来因为解析可能失败。 `A` 就是解析出来的具体数据类型。返回值中包括解析后的状态 `ParseState` ，这样就可以传递给下一个解析器函数，从而组合多个解析器。

而且很显然这个函数是一个 Monad ，为了为它实现 Monad 需要用 HKT 包装一下：

```java
class Parser<A>
        implements HKT<Parser<?>, A> {
    
    static <A> Parser<A>
    narrow(HKT<Parser<?>, A> v) {
        return (Parser<A>) v;
    }

    Function<ParseState,
             Maybe<Pair<A, ParseState>>>
                 parser;

    Parser(Function<ParseState,
        Maybe<Pair<A, ParseState>>> f) {
        parser = f;
    }

    Maybe<Pair<A, ParseState>>
    runParser(ParseState s) {
        return parser.apply(s);
    }

    Maybe<A> parse(String s) {
        MaybeM m = new MaybeM();
        return Maybe.narrow(
                 m.flatMap(runParser(
                     new ParseState(s)),
            r -> m.pure(r.first)));
    }
}
```

然后就可以实现 Parser Monad 了：

```java
class ParserM 
    implements Monad<Parser<?>> {
    
    public <A> HKT<Parser<?>, A> 
    pure(A v) {
        return new Parser<>(s ->
               new Maybe<>(
               new Pair<>(v, s)));
    }

    public <A> HKT<Parser<?>, A> 
    fail() {
        return new Parser<>(s -> 
               new Maybe<>());
    }

    public <A, B> HKT<Parser<?>, B>
    flatMap(HKT<Parser<?>, A> ma,
        Function<A, 
            HKT<Parser<?>, B>> f) {

        return new Parser<>(s -> {
            MaybeM m = new MaybeM();
            // 一点伪代码(not Haskell)
            // do
            //   r <- ma.runParser(s)
            //   f(r.first).runParser(
            //       r.second)
            return Maybe.narrow(
                     m.flatMap(Parser
                         .narrow(ma)
                         .runParser(s),
                r -> Parser
                     .narrow(f.apply(
                         r.first))
                     .runParser(
                         r.second))
            );
        });
    }
}

```

实现了 Monad 以后写 Parser 就可以不用管理错误回溯也不用手动传递解析状态，只需要把解析器看成一个抽象的容器，取出解析结果，组合，再放回容器。

这里举两个用 Parser Monad 写的组合函数：

```java
// class Parser<A>
<B> Parser<B>
map(Function<A, B> f) {
    ParserM m = new ParserM();
    // do
    //   x <- this
    //   pure (f(x))
    return narrow(
             m.flatMap(this,
        x -> m.pure(f.apply(x))));
}

<B, C> Parser<C>
combine(Parser<B> p,
        BiFunction<A, B, C> f) {
    ParserM m = new ParserM();
    // do
    //   a <- this
    //   b <- p
    //   pure (f(a, b))
    return narrow(
             m.flatMap(this,
        a -> m.flatMap(p,
        b -> m.pure(f.apply(a, b)))));
}
```



