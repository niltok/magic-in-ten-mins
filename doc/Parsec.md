# 十分钟魔法练习：解析器组合子

### By 「玩火」

> 前置技能：Java基础，HKT，Monad

## 常见组合子

解析器单子那期的最后给出了 `map` 和 `combine` 的定义，而 `combine` 可以进一步组合出只取自己结果和只取参数结果的组合子：

```java
// class Parser<A>

// 忽略参数解析器的解析结果
<B> Parser<A>
skip(Parser<B> p) {
    return combine(p, (a, b) -> a);
}
// 使用参数解析器的解析结果
<B> Parser<B>
use(Parser<B> p) {
    return combine(p, (a, b) -> b);
}
```

`or` 组合子可以在解析失败的时候用参数解析器来重新解析：

```java
// class Parser<A>
Parser<A>
or(Parser<A> p) {
    return new Parser<>(s -> {
        Maybe<Pair<A, ParseState>>
            r = runParser(s);
        if (r.value == null)
            return p.runParser(s);
        return r;
    });
}
```

`many` 组合子用来构造匹配任意个相同的解析器的解析器，用了 List 来返回结果，所以代码比较复杂：

```java
// class Parser<A>
Parser<List<A>>
many() {
    return new Parser<>(s -> {
        Maybe<Pair<A, ParseState>>
            r = runParser(s);
        if (r.value == null)
            return new Maybe<>(
                new Pair<>(
                new ArrayList<>(), s));
        Maybe<Pair<List<A>, ParseState>>
            rs = many().runParser(
                        r.value.second);
        rs.value.first.add(0,
                         r.value.first);
        return rs;
    });
}
```

`some` 组合子利用 `many` 定义，用来构造匹配一个及以上相同的解析器的解析器：

```java
// class Parser<A>
Parser<List<A>>
some() {
    return combine(many(), (x, xs) -> {
        xs.add(0, x);
        return xs;
    });
}
```

## 常见解析器

最基本的是 `id` 解析器，解析任意一个字符并作为解析结果返回：

```java
static Parser<Character> id =
        new Parser<>(s -> {
            
    if (s.p == s.s.length())
        return new Maybe<>();
            
    return new Maybe<>(
        new Pair<>(s.s.charAt(s.p),
                    s.next()));
            
});
```

有了 `id` 解析器之后构造的解析器就只需要把 `id` 和组合子组合而不需要再关心解析一个字符的细节。

最常用的解析器就是 `pred` ，解析一个符合要求的字符：

```java
static Parser<Character>
pred(Predicate<Character> f) {
    ParserM m = new ParserM();
    return narrow(
              m.flatMap(id,
         c -> f.test(c) ?
                  m.pure(c) :
                  m.fail()));
}
```

另一个常用的解析器是 `character` ，解析特定字符：

```java
static Parser<Character>
character(char x) {
    return pred(c -> c == x);
}
```

## 组合

既然叫解析器组合子，那么它们是用来组合的，这里给出如何用它们组合出一个解析浮点数的解析器例子：

```java
// 解析一个数字字符
static Parser<Integer> digit =
    pred(c -> '0' <= c && c <= '9')
                    p(c -> c - '0');
// 解析一个自然数
static Parser<Integer> nat =
        digit.some().map(xs -> {
    int x = 0;
    for (int i : xs) x = x * 10 + i;
    return x;
});
// 解析一个整数
static Parser<Integer> integer =
    (character('-').use(nat).map(x -> -x))
                   .or(nat);
// 解析一个浮点数
static Parser<Double> real =
    (integer.combine(character('.')
        .use(digit.some()).map(xs -> {
            double ans = 0, base = 0.1;
                for (int i : xs) {
                    ans += base * i;
                    base *= 0.1;
                }
                return ans;
            }),
            Double::sum)).or(integer
            .map(Integer::doubleValue));
```



