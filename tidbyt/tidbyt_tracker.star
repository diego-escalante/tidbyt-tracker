load("render.star", "render")
load("http.star", "http")
load("time.star", "time")

FONT = "tom-thumb"

TRACKER_URL = "http://localhost:8000/api/habits?habit=%s&from=%s&to=%s"

def get_data(habit, from_date, to_date):
    # habit names could have spaces. Prepare the names appropriately for using as query parameters.
    sanitized_habit = habit.replace(" ", "%20")
    rep = http.get(TRACKER_URL % (sanitized_habit, from_date, to_date))
    if rep.status_code != 200:
        return -1

    datesToStatus = {}
    for row in rep.json():
        datesToStatus[row.get('date')] = row.get('status')

    return datesToStatus

def get_dates():
    now = time.now()
    today = time.time(year=now.year, month=now.month, day=now.day)

    # Total numbers displayed can be 52 weeks + 1 day (sunday) to 52 weeks + 7 days (saturday).
    total_days_displayed = 7 * 52 + get_weekday_number(today) + 1

    # Start at the first day.
    starting_day = today - time.hour * 24 * (total_days_displayed - 1)

    return (starting_day, today, total_days_displayed)

def build_days(starting_day, today, total_days_displayed, habit_data, first_tracked_day, color_success, color_failure, color_neutral):
    weeks = []
    week = []
    streak = 0
    fails = 0
    successes = 0

    first_day_tracked = time.parse_time(first_tracked_day, "2006-01-02")

    for i in range(total_days_displayed):
        current_day = starting_day + time.hour * 24 * i

        day_status = habit_data.get(current_day.format("2006-01-02"))
        
        color = color_neutral
        if first_day_tracked <= current_day:
            if day_status == "SUCCESS":
                streak += 1
                successes += 1
                color = color_success
            elif day_status == "FAILURE" or (day_status == None and current_day != today):
                streak = 0
                fails += 1
                color = color_failure

        if current_day == today and day_status == None:
            color = "#FFFFFF"

        week.append(render.Box(width=1, height=1, color=color))

        if i % 7 == 6:
            weeks.append(render.Column(children = week))
            week = []

    if len(week) > 0:
        weeks.append(render.Column(children = week))

    rate = 0
    total = fails + successes
    if total != 0:
        rate = float(successes)/total

    return (render.Row(children=weeks), rate, streak)

def get_weekday_number(timeInput):
    daystr = timeInput.format("Monday")
    if daystr == "Sunday":
        return 0
    if daystr == "Monday":
        return 1
    if daystr == "Tuesday":
        return 2
    if daystr == "Wednesday":
        return 3
    if daystr == "Thursday":
        return 4
    if daystr == "Friday":
        return 5
    if daystr == "Saturday":
        return 6

def lerp(a, b, t):
    # clamp t
    if t > 1:
        t = 1
    elif t < 0:
        t = 0
    return float(a) + (float(b) - float(a)) * float(t)

def inverse_lerp(a, b, v):
    return (v - a) / (b - a)

def remap(iMin, iMax, oMin, oMax, v):
    t = inverse_lerp(iMin, iMax, v)
    return lerp(oMin, oMax, t)


def color_lerp(c1, c2, t):
    # Lerping through the rgb components is the "lazy" bad way of doing it. The middle colors don't look good.
    # https://www.alanzucconi.com/2016/01/06/colour-interpolation/
    c1 = c1.removeprefix("#")
    c2 = c2.removeprefix("#")

    r1 = int(c1[0:2], 16)
    g1 = int(c1[2:4], 16)
    b1 = int(c1[4:6], 16)

    r2 = int(c2[0:2], 16)
    g2 = int(c2[2:4], 16)
    b2 = int(c2[4:6], 16)

    r = lerp(r1, r2, t)
    g = lerp(g1, g2, t)
    b = lerp(b1, b2, t)

    sr = "%X" % r
    if len(sr) == 1:
        sr = "0" + sr
    sg = "%X" % g
    if len(sg) == 1:
        sg = "0" + sg
    sb = "%X" % b
    if len(sb) == 1:
        sb = "0" + sb
    
    return "#" + sr + sg + sb

def main(config):

    habit = config.get("habit")
    if habit == None:
        return render_message("No habit in config!")

    color_success = config.get("color", "#00FF00")
    first_tracked_day = config.get("first_tracked_day", "2020-01-01")
    color_failure = config.get("color_failure", "#ff0000")
    color_neutral = config.get("color_neutral", "#111111")

    (starting_day, today, total_days_displayed) = get_dates()

    data = get_data(habit, starting_day.format("2006-01-02"), today.format("2006-01-02"))

    if data == -1:
        return render_message("Unable to get habit data!")

    (calendar, rate, streak) = build_days(starting_day, today, total_days_displayed, data, first_tracked_day, color_success, color_failure, color_neutral)

    return render.Root(
        child = render.Column(
            expanded = True,
            cross_align = "center",
            main_align = "space_around",
            children = [
                render.Column(
                    cross_align = "center",
                    children = [
                        render.Marquee(child=render.Text(content=habit, font=FONT), width=62, align="center"),
                        render.Box(height=1, color=color_success),
                    ]
                ),
                render.Row(
                    expanded = True,
                    main_align = "space_evenly",
                    children = [
                        render.Text(content=str(rate * 100)[0:5] + "%", font=FONT, color=color_lerp(color_failure, color_success, remap(0.0, 0.8, 0.0, 1.0, rate))),
                        render.Text(content="%dd" % streak, font=FONT, color=color_lerp(color_failure, color_success, streak/10.0)),
                    ]
                ),
                calendar,
                render.Marquee(child=render.Text(content=get_message(rate, streak), font=FONT), width=62, align="center"),
            ]
        )
    )

def get_message(rate, streak):

    if streak == 69:
        return "nice."
    if streak == 420:
        return "Dank."
    if streak % 100 == 0 and streak != 0:
        return "CONGRATS ON THE %d DAY STREAK!!!" % streak
    if streak % 10 == 0 and streak != 0:
        return "%d days of victories!" % streak

    if streak == 0:
        if rate < 0.5:
            return "New day, new start."
        elif rate < 0.8:
            return "Jump back in!"
        else:
            return "Don't lose your success rate!"
    elif streak <= 5:
        if rate < 0.5:
            return "Good start, keep going!"
        if rate < 0.8:
            return "Build that streak!"
        else:
            return "Good recovery, keep at it!"
    elif streak <= 9:
        if rate < 0.5:
            return "Keep being consistent!"
        elif rate < 0.8:
            return "You're getting back on track!"
        else:
            return "You're doing a great job!"
    else:
        if rate < 0.5:
            return "Your consistency will pay off!"
        if rate < 0.8:
            return "Great habit building!"
        else:
            return "You are a super star!"

def render_message(msg):
    return render.Root(
        child = render.WrappedText(
            content=msg,
            font=FONT
        )
    )