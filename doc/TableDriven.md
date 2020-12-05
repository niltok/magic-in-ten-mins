# 十分钟魔法练习：表驱动编程

### By 「玩火」

> 前置技能： 简单Java基础

## Intro

表驱动编程被称为是普通程序员和高级程序员的分水岭，而它本身并没有那么难，甚至很多时候不知道的人也能常常重新发明它。而它本身在我看来是锻炼抽象思维的最佳途径，几乎所有复杂的系统都能利用表驱动法来进行进一步抽象优化，而这也非常考验程序员的水平。

## 数据表

学编程最开始总会遇到这样的经典习题：

> 输入成绩，返回等第， 90 以上 A ， 80 以上 B ， 70 以上 C ， 60 以上 D ，否则为 E

作为一道考察 `if` 语句的习题初学者总是会写出这样的代码：

```java
static char getLevel(int s) {
    if (s >= 90) return 'A';
    if (s >= 80) return 'B';
    if (s >= 70) return 'C';
    if (s >= 60) return 'D';
    return 'E';
}
```

等学了 `switch` 语句以后有些聪明的人会把它改成 `switch(s/10)` 的写法。

但是这两种写法都有个同样的问题：如果需要不断添加等第个数那最终 `getLevel` 函数就会变得很长很长，最终变得不可维护。

学会循环和数组后会有聪明人回头再看这个程序，会发现这个程序由反复的

```java
if (s >= _) return _;
```

构成，可以改成循环结构，把对应的数据塞进数组：

```java
static int[]  score = 
    {90, 80, 70, 60};
static char[] level = 
    {'A', 'B', 'C', 'D', 'E'};
static char getLeve(int s) {
    int pos = 0;
    for (; pos < score.length
            && s < score[pos];
         pos++);
    return level[pos];
}
```

这样的好处是只需要在两个数组中添加一个值就能加一组等第而不需要碰 `getLevel` 的逻辑代码。

而且进一步讲， `score` 和 `level` 数组可以被存在外部文件中作为配置文件，与源代码分离，这样不用重新编译就能轻松添加一组等第。

这就是表驱动编程最初阶的形式，通过抽取相似的逻辑并把不同的数据放入表中来避免逻辑重复，提高可读性和可维护性。

再举个带修改的例子，写一个有特定商品的购物车：

```java
class ShopList{
    class Item {
        String name;
        int price;
        int count = 0;
        Item(String name, int price) {
            this.name = name;
            this.price = price;
        }
    }
    Item[] items = {
            new Item("water", 1),
            new Item("cola" , 2),
            new Item("choco", 5)
    };
    ShopList buy(String name) {
        for (Item x : items)
            if (x.name.equals(name))
                x.count++;
        return this;
    }
    public String toString() {
        return Arrays.stream(items)
                .map(x -> 
                     x.name + "($" + 
                     x.price + "/per): " + 
                     x.count)
                .collect(Collectors
                         .joining("\n"));
    }
}
```

## 逻辑表

初学者在写习题的时候还会碰到另一种没啥规律的东西，比如：

> 用户输入 0 时购买 water ，输入 1 时购买 cola ，输入 2 时打印购买的情况，输入 3 退出系统。

看似没有可以抽取数据的相似逻辑。但是细想一下，真的没有公共逻辑吗？实际上公共的逻辑在于这些都是在同一个用户输入情况下触发的事件，区别就在于不同输入触发的逻辑不一样，那么其实可以就把逻辑制成表：

```java
class SimpleUI {
    ShopList list = new ShopList();
    Runnable[] event = {
        () -> list.buy("water"),
        () -> list.buy("cola"),
        () -> System.out.println(list),
        () -> System.exit(0)
    };
    int[] index = {0, 1, 2, 3};
    void runEvent(int e) {
        for (int i = 0; 
             i < index.length; 
             i++)
            if (index[i] == e) 
                event[i].run();
    }
}
```

这样如果需要添加一个用户输入指令只需要在 `event` 表和 `index` 表中添加对应逻辑和索引，修改用户的指令对应的逻辑也变得非常方便，甚至可以把用户指令存在配置文件里提供自定义修改。这样用户输入和时间触发两个逻辑就不会串在一起，维护起来更加方便。

## 自动机

如果再加个逻辑表能修改的跳转状态就构成了自动机（Automaton）。这里举个例子，利用自动机实现了一个复杂的 UI ，在 `menu` 界面可以选择开始玩或者退出，在 `move` 界面可以选择移动或者打印位置或者返回 `menu` 界面：

```java
class ComplexUI {
    interface Jumper {
        void jump(char c);
    }

    // 界面绘制
    Runnable[] draw = {
        () -> { /* draw menu */ },
        () -> { /* draw play */ }
    };

    Jumper[] jumpers = {
        this::menu,
        this::move
    };
    
    int state;
    int x = 0, y = 0;
    
    static class CharEvent {
        char c;
        Runnable e;
        CharEvent(char c, Runnable e) {
            this.c = c;
            this.e = e;
        }
    }
    
    void menu(char c) {
        CharEvent[] events = {
            new CharEvent('p', () -> 
                jumpTo(1)),
            new CharEvent('q', () ->
                System.exit(0))
        };
        for (CharEvent i : events)
            if (i.c == c) i.e.run();
    }

    void move(char c) {
        CharEvent[] events = {
            new CharEvent('w', () -> y++),
            new CharEvent('s', () -> y--),
            new CharEvent('d', () -> x++),
            new CharEvent('a', () -> x--),
            new CharEvent('e', () ->
                System.out.println(
                    "{x=" + x + 
                    ";y=" + y + "}")),
            new CharEvent('q', () -> 
                jumpTo(0))
        };
        for (CharEvent i : events)
            if (i.c == c) i.e.run();
    }
    
    private void jumpTo(int s) {
        state = s;
        draw[state].run();
    }

    void runEvent(char c) {
        jumpers[state].jump(c);
    }

    {
        jumpTo(0);
    }
}
```

实际上更标准的写法应该把状态设定成枚举，这里为了演示的简单期间并没有那样写。

同时推荐不用下标作为表的索引标签，并总是把所有相关状态打包起来放在同一个类里面而不是用不同数组的相同下标来访问，这样可以有更加紧凑的语义和更好的缓存命中率。

