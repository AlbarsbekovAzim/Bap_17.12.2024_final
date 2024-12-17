// Исходные данные
// const logData = [
//     { user: "User2", time: "2024-12-01 12:00", action: "login" },
//     { user: "User1", time: "2024-12-01 13:30", action: "logout" },
//     { user: "User3", time: "2024-12-01 14:00", action: "login" },
//     { user: "User2", time: "2024-12-01 16:00", action: "logout" },
//     { user: "User1", time: "2024-12-01 17:00", action: "login" },
//     { user: "User3", time: "2024-12-01 17:30", action: "logout" },
//     { user: "User3", time: "2024-12-01 17:30", action: "logout" },
//     { user: "User1", time: "2024-12-01 18:30", action: "logout" },
//     { user: "User1", time: "2024-12-02 01:30", action: "login" },
//     { user: "User4", time: "2025-08-02 01:30", action: "login" },
//     { user: "User4", time: "2025-12-02 01:30", action: "login" },
//     { user: "User4", time: "2029-12-02 01:30", action: "logout" },
// ];


// Шаг 1: Сортировка логов по времени
logData.sort((a, b) => new Date(a.time) - new Date(b.time));

// Шаг 2: Инициализация переменных для анализа
const userSessions = {}; // Сессии пользователей
const anomalies = {
    openSessions: [], // Сессии без закрытия
    overlappingSessions: [], // Одновременные сессии
};
const userDurations = {}; // Суммарное время активности

// Шаг 3: Обработка логов
logData.forEach((log) => {
    const { user, time, action } = log;
    if (!userSessions[user]) userSessions[user] = [];

    const session = userSessions[user].find((s) => s.end === null);
    if (action === "login") {
        if (session) {
            console.log(user, ' already have session', session, {start: time, end: null})
        } else {
            userSessions[user].push({ start: time, end: null });
        }
    } else if (action === "logout") {
        if (session) {
            session.end = time;
        } else {
            console.log(user, ' hasnt logined yeat, ', {start: time, end: null})
        }
    }
});

// Шаг 4: Выявление аномалий и подсчет времени
Object.keys(userSessions).forEach((user) => {
    let overlapping = 0;
    userSessions[user].forEach((session, i) => {
        // Вычисляем длительность сессии
        if (session.end) {
            const duration =
                (new Date(session.end) - new Date(session.start)) / 1000 / 60; // в минутах
            if (!userDurations[user]) userDurations[user] = {
                years: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                fullminutes: 0
            };
            let remainder = 0
            userDurations[user]['years'] += Math.floor(duration / 525600);
            remainder = duration % 525600;
            userDurations[user]['days'] += Math.floor(remainder / 1440);
            remainder = remainder % 1440;
            userDurations[user]['hours'] += Math.floor(remainder / 60);
            remainder = remainder % 60;
            userDurations[user]['minutes'] += remainder;
            userDurations[user]['fullminutes'] += duration
        } else {
            anomalies.openSessions.push({ user, session });
        }

        // Проверяем пересечения сессий
        for (let j = i + 1; j < userSessions[user].length; j++) {
            const other = userSessions[user][j];
            if (
                new Date(session.start) < new Date(other.end || Infinity) &&
                new Date(other.start) < new Date(session.end || Infinity)
            ) {
                overlapping++;
            }
        }
    });
    if (overlapping > 0) {
        anomalies.overlappingSessions.push({ user, overlapping });
    }
});

// Шаг 5: Анализ статистики
const mostActiveUser = Object.entries(userDurations).sort(
    (a, b) => b[1]['fullminutes'] - a[1]['fullminutes']
)[0];
let fullminutes_mass = []
Object.values(userDurations).forEach((obj_time) => {
    fullminutes_mass.push(obj_time['fullminutes'])
})
const averageSessionTimeInMinutes =
    fullminutes_mass.reduce((a, b) => a + b, 0) /
    fullminutes_mass.length;
const averageSessionTime = {
    years: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    fullminutes: 0
}
let remainder = 0
averageSessionTime['years'] += Math.floor(averageSessionTimeInMinutes / 525600);
remainder = averageSessionTimeInMinutes % 525600;
averageSessionTime['days'] += Math.floor(remainder / 1440);
remainder = remainder % 1440;
averageSessionTime['hours'] += Math.floor(remainder / 60);
remainder = remainder % 60;
averageSessionTime['minutes'] += remainder;
averageSessionTime['fullminutes'] += averageSessionTimeInMinutes

const longestUserDuration = {};

Object.keys(userSessions).forEach((user) => {
    userSessions[user].forEach((session) => {
        if (session.end) {
            const duration =
                (new Date(session.end) - new Date(session.start)) / 1000 / 60; // в минутах
            if (!longestUserDuration[user]) {
                longestUserDuration[user] = session
                longestUserDuration[user]['duration'] = duration
            } else if (longestUserDuration[user] && longestUserDuration[user]['duration'] < duration) {
                longestUserDuration[user] = session
                longestUserDuration[user]['duration'] = duration
            };
        }
    })
});

// Шаг 6: Вывод результатов
console.log("Список всех сессий:", userSessions);
console.log("Самая долгая сессия для каждого пользователя:", longestUserDuration);
console.log("Открытые сессии (без завершения):", anomalies.openSessions);
console.log("Перекрывающиеся сессии:", anomalies.overlappingSessions);
console.log("Самый активный пользователь:", mostActiveUser);
console.log("Среднее время сессии:", averageSessionTime);
console.log("Суммарное время активности по пользователям:", userDurations);
