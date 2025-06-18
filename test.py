# はのいのとう〜

def hanoi(n, f, t, w, s):
    if n == 0:
        return
    hanoi(n - 1, f, w, t, s)
    print(f"{s[0]}. {n}番目の板を{f}から{t}に動かす。")
    s[0] += 1
    hanoi(n - 1, w, t, f, s)

taouru = (45, "a", "c", "b")
if __name__ == "__main__":
    n1, t1, t2, t3 = taouru
    s = [0]
    hanoi(n1, t1, t2, t3, s)