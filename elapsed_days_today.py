from datetime import datetime

start_date = datetime(2025, 1, 1)
end_date = datetime.today()  # 今日の日付を取得

elapsed_days = (end_date - start_date).days + 1
print(f"2025/01/01を含む今日({end_date.strftime('%Y/%m/%d')})までの経過日数は {elapsed_days} 日です。")