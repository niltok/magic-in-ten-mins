# 十分钟魔法练习：依赖注入

### By 「玩火」

> 前置技能：Java基础，Monad，代数作用

## 模块依赖

有时候某些类需要在被调用方法的时候使用其他类：

```java
class Human {
    void please() {
        new Hand().rush();
    }
    <T> void pick(T thing) {
        new Hand().hold(thing);
    }
}
```

不过像上面的 `hand` 在每次调用的时候都创建一个实例对 GC 就很不友好，实际上如果不是一次性的东西完全可以复用：

```java
class Human {
    Hand hand = new Hand();
    void please() {
        hand.rush();
    }
    <T> void pick(T thing) {
        hand.hold(thing);
    }
}
```

这样处理 `Human` 的依赖可以增强扩展性，比如换一个 `Hand` 实现只需要改一个地方。

而这个 `Hand` 在这里就是 `Human` 的一个**依赖**，也就是说 `Human` **依赖** `Hand` 。

## 依赖注入

> 依赖注入就是我依赖你，你把你注入给我。
>
> By 千里冰封

上面的代码有个问题，如果两个人的手依赖不同的实现该怎么办？如果一个人的手是肉做的一个人是机械手该怎么办？

这时候就应该让构造 `Human` 的代码来选择构造什么样的 `Hand` 然后赋值给对应的属性或者直接传给构造函数：

```java
class Human {
    Hand hand;
    Human(Hand hand) {
        this.hand = hand;
    }
}
```

这样使用 `Human` 的代码在构造 `Human` 的时候就需要传入它的依赖，也就是完成一次对 `Human` 的**依赖注入**（Dependency Injection），依赖从使用 `Human` 的代码转移到了 `Human` 中。

这样设计就可以在造人的时候选择人有什么样的手，甚至还能让两个人共用一个手。

## 自动注入

每次在使用 `Human` 的时候都要自己搓一个 `Hand` 塞进去实在是太麻烦，很多时候只需要默认的 `Hand` 就行了。这时候就需要工厂模式来自动注入依赖：

```java
class HumanFactory {
    Hand hand;
    HumanFactory withHand(Hand hand) {
        this.hand = hand;
        return this;
    }
    Human build() {
        if (hand == null) 
            hand = new HandDefault();
        return new Human(hand);
    }
}
```

这种注入依赖的方法对一堆依赖的模块效果拔群，只需要配置部分依赖就可以正确使用。

## 依赖注入框架

工厂模式有个问题，当产出物非常非常复杂的时候代码量极大，但这实际上都是能自动生成的重复代码，于是人们就在这一层上进一步抽象，做出了依赖注入框架来自动生成装配工厂代码。

例如在Spring中可以通过这样添加注解来生成自动依赖注入代码：

```java
@Component("Human")
class Human {
    @Resource(name="handDefault")
    Hand hand;
}
```

而调用 `context.getBean("Human")` 就可以得到一个 `Human` 的实例。

## 读取器单子

如果你精通函数式编程就会想到为啥 `Hand` 要放在对象里面呢，保存状态多不好。于是第一个程序可以改成：

```java
class Human {
    void please(Hand hand) {
        hand.rush();
    }
    <T> void pick(Hand hand, T thing) {
        hand.hold(thing);
    }
}
```

不过这样每个函数都要传一遍 `Hand` 就挺麻烦的，这时候就可以使用 `Reader Monad` 来改写这两个方法：

```java
class Human {
    Reader<Hand, Hand> please() {
        ReaderM<Hand> m = new ReaderM<>();
        return Reader.narrow(
            m.flatMap(m.ask,
            hand -> {
                hand.rush();
                return m.pure(hand);
            }));
    }
    <T> Reader<Hand, Hand> pick(T thing) {
        ReaderM<Hand> m = new ReaderM<>();
        return Reader.narrow(
            m.flatMap(m.ask,
            hand -> {
                hand.hold(thing);
                return m.pure(hand);
            }));
    }
}
```

这样就可以让一个环境在函数之间隐式传递，来达到依赖注入的目的。

不过……这似乎看上去更加复杂了……

我在这里只是提供一种思路，在某些对 `Monad` 支持良好的语言中这种思路是一种更简便的办法。

## 代数作用

讲到 `Reader Monad` ，读过代数作用那期的读者就会想到 `Reader Monad` 和代数作用是同构的。那既然 `Reader Monad` 能用来注入依赖，代数作用也可以：

```java
class Human {
    void please(Runnable cont) {
        Eff.Perform("Hand", hand -> {
            ((Hand) hand).rush();
            cont.run();
        });
    }
    <T> void pick(T thing, Runnable cont) {
        Eff.Perform("Hand", hand -> {
            ((Hand) hand).hold(thing);
            cont.run();
        })
    }
}
```

这样看上去就比 `Reader Monad` 的写法清晰很多，虽然回调的写法也挺反人类的……不过在支持代数作用的语言里面这种写法将是强力的依赖注入工具。
