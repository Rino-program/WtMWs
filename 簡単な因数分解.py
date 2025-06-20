li_i = list(input().split())
def is_num(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

def tyusyutu(n):
    for i in range(len(n), 0, -1):
        if is_num(n[:i]):
            print(n[:i])