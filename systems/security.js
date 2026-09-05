const {
    AuditLogEvent,
    PermissionsBitField
} = require("discord.js");

// ==========================================
// CONFIGURACIÓN
// ==========================================

const CONFIG = {
    STAFF_ROLE: "1540815218689441812",
    SECURITY_LOGS: "1539791936058163241"
};

// ==========================================
// LÍMITES DE SEGURIDAD
// ==========================================

const LIMITS = {
    spam: {
        max: 5,
        window: 3000,
        action: "timeout"
    },

    mention: {
        max: 5,
        window: 5000,
        action: "timeout"
    },

    roleDelete: {
        max: 2,
        window: 10000,
        action: "ban"
    },

    channelDelete: {
        max: 2,
        window: 10000,
        action: "ban"
    },

    botAdd: {
        max: 2,
        window: 30000,
        action: "ban"
    },

    ban: {
        max: 3,
        window: 10000,
        action: "ban"
    },

    kick: {
        max: 3,
        window: 10000,
        action: "ban"
    }
};

// ==========================================
// TRACKERS
// ==========================================

const trackers = new Map();

function getTracker(type, userId) {
    const key = `${type}:${userId}`;

    if (!trackers.has(key)) {
        trackers.set(key, []);
    }

    return trackers.get(key);
}

function addAction(type, userId, window) {
    const now = Date.now();
    const tracker = getTracker(type, userId);

    tracker.push(now);

    const valid = tracker.filter(
        timestamp => now - timestamp <= window
    );

    trackers.set(
        `${type}:${userId}`,
        valid
    );

    return valid.length;
}

// ==========================================
// STAFF
// ==========================================

function isStaff(member) {
    if (!member) return false;

    return member.roles?.cache?.has(
        CONFIG.STAFF_ROLE
    );
}

// ==========================================
// LOGS
// ==========================================

async function securityLog(
    guild,
    title,
    description
) {
    const channel = guild.channels.cache.get(
        CONFIG.SECURITY_LOGS
    );

    if (!channel) return;

    await channel.send({
        embeds: [
            {
                title,
                description,
                timestamp: new Date().toISOString()
            }
        ]
    }).catch(() => {});
}

// ==========================================
// TIMEOUT
// ==========================================

async function timeoutMember(
    member,
    duration = 10000,
    reason = "DICA Guard - Protección automática"
) {
    if (!member) return false;

    if (!member.moderatable) {
        return false;
    }

    try {
        await member.timeout(
            duration,
            reason
        );

        return true;
    } catch {
        return false;
    }
}

// ==========================================
// BAN
// ==========================================

async function banMember(
    member,
    reason = "DICA Guard - Protección automática"
) {
    if (!member) return false;

    if (!member.bannable) {
        return false;
    }

    try {
        await member.ban({
            reason
        });

        return true;
    } catch {
        return false;
    }
}

// ==========================================
// ANTI-SPAM
// ==========================================

async function checkSpam(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    const member = message.member;

    if (isStaff(member)) return;

    const count = addAction(
        "spam",
        message.author.id,
        LIMITS.spam.window
    );

    if (count >= LIMITS.spam.max) {
        const punished = await timeoutMember(
            member,
            10000,
            "DICA Guard - Anti-Spam"
        );

        if (punished) {
            await securityLog(
                message.guild,
                "🛡️ Anti-Spam",
                [
                    `**Usuario:** ${message.author}`,
                    `**ID:** \`${message.author.id}\``,
                    `**Acción:** TIMEOUT`,
                    `**Duración:** 10 segundos`,
                    `**Límite:** ${LIMITS.spam.max} mensajes`,
                    `**Ventana:** 3 segundos`
                ].join("\n")
            );
        }

        trackers.delete(
            `spam:${message.author.id}`
        );
    }
}

// ==========================================
// ANTI-MENTION
// ==========================================

async function checkMentions(message) {
    if (!message.guild) return;
    if (message.author.bot) return;

    if (isStaff(message.member)) return;

    const mentions =
        message.mentions.users.size +
        message.mentions.roles.size;

    if (mentions === 0) return;

    const count = addAction(
        "mention",
        message.author.id,
        LIMITS.mention.window
    );

    if (count >= LIMITS.mention.max) {
        const punished = await timeoutMember(
            message.member,
            10000,
            "DICA Guard - Anti-Mention"
        );

        if (punished) {
            await securityLog(
                message.guild,
                "🛡️ Anti-Mention",
                [
                    `**Usuario:** ${message.author}`,
                    `**ID:** \`${message.author.id}\``,
                    `**Acción:** TIMEOUT`,
                    `**Límite:** ${LIMITS.mention.max}`,
                    `**Ventana:** 5 segundos`
                ].join("\n")
            );
        }

        trackers.delete(
            `mention:${message.author.id}`
        );
    }
}

// ==========================================
// DETECTAR BOTS NUEVOS
// ==========================================

async function checkBotAdd(member) {
    if (!member.guild) return;

    if (!member.user.bot) return;

    const count = addAction(
        "botAdd",
        member.guild.id,
        LIMITS.botAdd.window
    );

    await securityLog(
        member.guild,
        "🤖 Bot añadido",
        [
            `**Bot:** ${member.user}`,
            `**ID:** \`${member.id}\``,
            `**Bots detectados:** ${count}`,
            `**Ventana:** 30 segundos`
        ].join("\n")
    );

    if (count >= LIMITS.botAdd.max) {
        await securityLog(
            member.guild,
            "🚨 Posible Raid de Bots",
            [
                `Se detectaron **${count} bots**`,
                "DICA Guard activó la protección."
            ].join("\n")
        );
    }
}

// ==========================================
// ELIMINACIÓN DE ROLES
// ==========================================

async function handleRoleDelete(role) {
    const guild = role.guild;

    const logs = await guild.fetchAuditLogs({
        type: AuditLogEvent.RoleDelete,
        limit: 1
    }).catch(() => null);

    if (!logs) return;

    const entry = logs.entries.first();

    if (!entry) return;

    const executor = entry.executor;

    if (!executor) return;

    const count = addAction(
        "roleDelete",
        executor.id,
        LIMITS.roleDelete.window
    );

    await securityLog(
        guild,
        "🗑️ Rol eliminado",
        [
            `**Usuario:** ${executor}`,
            `**ID:** \`${executor.id}\``,
            `**Rol:** ${role.name}`,
            `**Eliminaciones:** ${count}`,
            `**Ventana:** 10 segundos`
        ].join("\n")
    );

    const member = await guild.members
        .fetch(executor.id)
        .catch(() => null);

    if (
        member &&
        !isStaff(member) &&
        count >= LIMITS.roleDelete.max
    ) {
        await banMember(
            member,
            "DICA Guard - Eliminación masiva de roles"
        );
    }
}

// ==========================================
// ELIMINACIÓN DE CANALES
// ==========================================

async function handleChannelDelete(channel) {
    const guild = channel.guild;

    const logs = await guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1
    }).catch(() => null);

    if (!logs) return;

    const entry = logs.entries.first();

    if (!entry) return;

    const executor = entry.executor;

    if (!executor) return;

    const count = addAction(
        "channelDelete",
        executor.id,
        LIMITS.channelDelete.window
    );

    await securityLog(
        guild,
        "🗑️ Canal eliminado",
        [
            `**Usuario:** ${executor}`,
            `**ID:** \`${executor.id}\``,
            `**Canal:** ${channel.name}`,
            `**Eliminaciones:** ${count}`,
            `**Ventana:** 10 segundos`
        ].join("\n")
    );

    const member = await guild.members
        .fetch(executor.id)
        .catch(() => null);

    if (
        member &&
        !isStaff(member) &&
        count >= LIMITS.channelDelete.max
    ) {
        await banMember(
            member,
            "DICA Guard - Eliminación masiva de canales"
        );
    }
}

// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    CONFIG,
    LIMITS,
    trackers,

    isStaff,
    securityLog,

    checkSpam,
    checkMentions,
    checkBotAdd,

    handleRoleDelete,
    handleChannelDelete,

    timeoutMember,
    banMember
};
