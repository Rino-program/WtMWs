import random, copy, os, sys, time

EMPTY="."
WALL="#"
LIGHT="L"
DIRS=[(1,0),(-1,0),(0,1),(0,-1)]

# --------------------

def inb(h,w,y,x):
    return 0<=y<h and 0<=x<w

def ray(grid,y,x):
    h,w=len(grid),len(grid[0])
    for dy,dx in DIRS:
        ny,nx=y+dy,x+dx
        while inb(h,w,ny,nx) and grid[ny][nx]!=WALL:
            yield ny,nx
            ny+=dy; nx+=dx

def sees_light(grid,y,x):
    for ny,nx in ray(grid,y,x):
        if grid[ny][nx]==LIGHT:
            return True
    return False

# --------------------
# 壁生成
# --------------------

def random_walls(h,w):
    g=[[EMPTY]*w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if random.random()<0.28:
                g[y][x]=WALL
    return g

# --------------------
# 解生成
# --------------------

def generate_solution(base):
    g=copy.deepcopy(base)
    h,w=len(g),len(g[0])
    cells=[(y,x) for y in range(h) for x in range(w) if g[y][x]==EMPTY]
    random.shuffle(cells)
    for y,x in cells:
        if not sees_light(g,y,x):
            g[y][x]=LIGHT
    return g

# --------------------
# 数字付与（黒マスの一部だけ）
# --------------------

def build_clues(base,sol):
    h,w=len(base),len(base[0])
    clue=[[None]*w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if base[y][x]==WALL and random.random()<0.6:
                c=0
                for dy,dx in DIRS:
                    ny,nx=y+dy,x+dx
                    if inb(h,w,ny,nx) and sol[ny][nx]==LIGHT:
                        c+=1
                clue[y][x]=c
    return clue

# --------------------
# ソルバー
# --------------------

def count_solutions(base,clue,limit=2):
    h,w=len(base),len(base[0])
    board=[row[:] for row in base]
    empties=[(y,x) for y in range(h) for x in range(w) if base[y][x]==EMPTY]
    sols=0

    def can_place(y,x):
        return not sees_light(board,y,x)

    def digit_ok(wy,wx):
        if clue[wy][wx] is None:
            return True
        need=clue[wy][wx]
        k=u=0
        for dy,dx in DIRS:
            ny,nx=wy+dy,wx+dx
            if inb(h,w,ny,nx) and base[ny][nx]==EMPTY:
                if board[ny][nx]==LIGHT:
                    k+=1
                elif can_place(ny,nx):
                    u+=1
        return k<=need<=k+u

    def dfs(i):
        nonlocal sols
        if sols>=limit: return
        if i==len(empties):
            for y,x in empties:
                if board[y][x]!=LIGHT and not sees_light(board,y,x):
                    return
            sols+=1
            return

        y,x=empties[i]

        if sees_light(board,y,x):
            dfs(i+1)
            return

        # try light
        if can_place(y,x):
            board[y][x]=LIGHT
            ok=True
            for dy,dx in DIRS:
                wy,wx=y+dy,x+dx
                if inb(h,w,wy,wx) and not digit_ok(wy,wx):
                    ok=False; break
            if ok:
                dfs(i+1)
            board[y][x]=EMPTY

        # try empty
        ok=True
        for dy,dx in DIRS:
            wy,wx=y+dy,x+dx
            if inb(h,w,wy,wx) and not digit_ok(wy,wx):
                ok=False; break
        if ok:
            dfs(i+1)

    dfs(0)
    return sols

# --------------------
# 出力
# --------------------

def write_txt(base,clue,filename):
    h,w=len(base),len(base[0])
    with open(filename,"w") as f:
        f.write("pzprv3\nlightup\n")
        f.write(str(h)+"\n"+str(w)+"\n")
        for y in range(h):
            row=[]
            for x in range(w):
                if base[y][x]==WALL:
                    if clue[y][x] is None:
                        row.append("#")
                    else:
                        row.append(str(clue[y][x]))
                else:
                    row.append(".")
            f.write(" ".join(row)+"\n")

# --------------------

def generate_loop():
    os.makedirs("output",exist_ok=True)
    puzzle_id=0

    while True:
        puzzle_id+=1
        print(f"\n=== Puzzle {puzzle_id} ===")
        start_time=time.time()
        tries=0

        while True:
            tries+=1
            print(f" Try {tries}: generating walls...", end="")

            base=random_walls(7,8)
            sol=generate_solution(base)
            clue=build_clues(base,sol)

            print(" solving...", end="")
            sols=count_solutions(base,clue)

            elapsed=time.time()-start_time
            print(f" sols={sols}  elapsed={elapsed:.2f}s")

            if sols==1:
                r=random.randint(1000,9999)
                name=f"Akari_{r}.txt"
                write_txt(base,clue,"output/"+name)
                print(f" ✔ Saved {name}")
                break


# --------------------

if __name__=="__main__":
    generate_loop()
