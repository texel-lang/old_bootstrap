struct Point {
    double x = true;
    double y;
}

fn createPoint(double x, double y): Point {
    return {
        .x = x,
        .y = y,
    };
}

fn main(): void {
    Point point = createPoint(1, 2);
    double x = createPoint(3, 4).x;

    double y = point.y;

    boolean bool = false;
    double thing = 1 + 2.45;
    loop (bool) {
        bool = !bool;
    }
}
