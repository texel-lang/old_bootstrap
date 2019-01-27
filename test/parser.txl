enum Foo {
    Bar,
    Baz,
    WOW,
}

alias Bar = Foo.Bar;

interface X <T, T : double> {

    mut fn doFoo(Bar baz): double[];
}

mut fn DooStuff(boolean jep): void {
    return;
}

closed struct Optional<T> {
    boolean isMyField = true;

    struct Ok {
        T result;
    }

    struct Err {
        Error err;
    }
}

fn Optional<Foo>.Err.print(): void {
    console.log(this.err.message);
}
