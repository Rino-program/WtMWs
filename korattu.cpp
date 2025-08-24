#include <iostream>
#include <fstream>
#include <unordered_map>

int collatz_steps(long long n, std::unordered_map<long long, int>& memo) {
    if (n == 1) return 0;
    if (memo.count(n)) return memo[n];
    long long next = (n % 2 == 0) ? n / 2 : 3 * n + 1;
    int steps = 1 + collatz_steps(next, memo);
    memo[n] = steps;
    return steps;
}

int main() {
    std::unordered_map<long long, int> memo;
    std::ofstream ofs("output.txt");
    if (!ofs) {
        std::cerr << "Failed to open output.txt\n";
        return 1;
    }
    const int MAX_N = 10000000; // 必要に応じて変更
    for (int i = 1; i <= MAX_N; ++i) {
        int steps = collatz_steps(i, memo);
        ofs << i << ": " << steps << "\n";
    }
    ofs.close();
    return 0;
}