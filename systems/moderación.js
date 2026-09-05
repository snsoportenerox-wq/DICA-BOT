const {
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");

// ==========================================
// CONFIGURACIÓN
// ==========================================

const CONFIG = {
    STAFF_ROLE: "1540815218689441812",
    LOG_CHANNEL: "1539791936058163241"
};

// ==========================================
// WARNINGS
// ==========================================

const warnings = new Map();

// ==========================================
// COMPROBAR STAFF
// ==========================================

function isStaff(member) {
    if (!member) return false;

    return member.roles.cache.has(
        CONFIG.STAFF_ROLE
    );
}

// ==========================================
// OBTENER USUARIO
// ==========================================

async function getMember(message, argument) {
    if (!argument) return null;

    const mentioned = message.mentions.members.first();

    if (mentioned) {
        return mentioned;
    }

    const id = argument.replace(/[<@!>]/g, "");

    return await message.guild.members
        .fetch(id)
        .catch(() => null);
}

// ==========================================
// LOG
// ==========================================

async function logAction(
    guild,
    title,
    description
) {
    const channel = guild.channels.cache.get(
        CONFIG.LOG_CHANNEL
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
// WARN
// ==========================================

async function warn(message, args) {
    if (!isStaff(message.member)) {
        return message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );
    }

    const member = await getMember(
        message,
        args[0]
    );

    if (!member) {
        return message.reply(
            "❌ Debes mencionar a un usuario."
        );
    }

    if (member.id === message.author.id) {
        return message.reply(
            "❌ No puedes sancionarte a ti mismo."
        );
    }

    const reason =
        args.slice(1).join(" ") ||
        "Sin razón especificada";

    if (!warnings.has(member.id)) {
        warnings.set(member.id, []);
    }

    const userWarnings =
        warnings.get(member.id);

    userWarnings.push({
        moderator: message.author.id,
        reason,
        date: Date.now()
    });

    await message.reply(
        `⚠️ <@${member.id}> recibió una advertencia.\n` +
        `**Razón:** ${reason}\n` +
        `**Advertencias:** ${userWarnings.length}`
    );

    await logAction(
        message.guild,
        "⚠️ WARN",
        [
            `**Usuario:** ${member.user}`,
            `**ID:** \`${member.id}\``,
            `**Staff:** ${message.author}`,
            `**Razón:** ${reason}`,
            `**Total:** ${userWarnings.length}`
        ].join("\n")
    );
}

// ==========================================
// WARNINGS
// ==========================================

async function showWarnings(message, args) {
    if (!isStaff(message.member)) {
        return message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );
    }

    const member = await getMember(
        message,
        args[0]
    );

    if (!member) {
        return message.reply(
            "❌ Debes mencionar a un usuario."
        );
    }

    const userWarnings =
        warnings.get(member.id) || [];

    if (userWarnings.length === 0) {
        return message.reply(
            `📋 <@${member.id}> no tiene advertencias.`
        );
    }

    const list = userWarnings
        .map(
            (warning, index) =>
                `**${index + 1}.** ${warning.reason}\n` +
                `Staff: <@${warning.moderator}>\n` +
                `Fecha: <t:${Math.floor(
                    warning.date / 1000
                )}:F>`
        )
        .join("\n\n");

    await message.reply({
        embeds: [
            {
                title: `📋 Advertencias de ${member.user.username}`,
                description: list,
                timestamp: new Date().toISOString()
            }
        ]
    });
}

// ==========================================
// TIMEOUT
// ==========================================

async function timeout(message, args) {
    if (!isStaff(message.member)) {
        return message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );
    }

    const member = await getMember(
        message,
        args[0]
    );

    if (!member) {
        return message.reply(
            "❌ Debes mencionar a un usuario."
        );
    }

    const duration =
        Number(args[1]) || 60;

    const reason =
        args.slice(2).join(" ") ||
        "Sin razón especificada";

    if (!member.moderatable) {
        return message.reply(
            "❌ No puedo aplicar timeout a este usuario."
        );
    }

    if (duration < 1 || duration > 40320) {
        return message.reply(
            "❌ La duración debe estar entre 1 minuto y 28 días."
        );
    }

    await member.timeout(
        duration * 60 * 1000,
        reason
    );

    await message.reply(
        `🔇 <@${member.id}> recibió un timeout de **${duration} minutos**.\n` +
        `**Razón:** ${reason}`
    );

    await logAction(
        message.guild,
        "🔇 TIMEOUT",
        [
            `**Usuario:** ${member.user}`,
            `**Staff:** ${message.author}`,
            `**Duración:** ${duration} minutos`,
            `**Razón:** ${reason}`
        ].join("\n")
    );
}

// ==========================================
// UNTIMEOUT
// ==========================================

async function untimeout(message, args) {
    if (!isStaff(message.member)) {
        return message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );
    }

    const member = await getMember(
        message,
        args[0]
    );

    if (!member) {
        return message.reply(
            "❌ Debes mencionar a un usuario."
        );
    }

    await member.timeout(
        null,
        "Timeout eliminado por Staff"
    );

    await message.reply(
        `🔊 Timeout eliminado a <@${member.id}>.`
    );

    await logAction(
        message.guild,
        "🔊 UNTIMEOUT",
        `**Usuario:** ${member.user}\n**Staff:** ${message.author}`
    );
}

// ==========================================
// KICK
// ==========================================

async function kick(message, args) {
    if (!isStaff(message.member)) {
        return message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );
    }

    const member = await getMember(
        message,
        args[0]
    );

    if (!member) {
        return message.reply(
            "❌ Debes mencionar a un usuario."
        );
    }

    if (!member.kickable) {
        return message.reply(
            "❌ No puedo expulsar a este usuario."
        );
    }

    const reason =
        args.slice(1).join(" ") ||
        "Sin razón especificada";

    await member.kick(reason);

    await message.reply(
        `👢 <@${member.id}> fue expulsado.\n` +
        `**Razón:** ${reason}`
    );

    await logAction(
        message.guild,
        "👢 KICK",
        [
            `**Usuario:** ${member.user}`,
            `**ID:** \`${member.id}\``,
            `**Staff:** ${message.author}`,
            `**Razón:** ${reason}`
        ].join("\n")
    );
}

// ==========================================
// BAN
// ==========================================

async function ban(message, args) {
    if (!isStaff(message.member)) {
        return message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );
    }

    const member = await getMember(
        message,
        args[0]
    );

    if (!member) {
        return message.reply(
            "❌ Debes mencionar a un usuario."
        );
    }

    if (!member.bannable) {
        return message.reply(
            "❌ No puedo banear a este usuario."
        );
    }

    const reason =
        args.slice(1).join(" ") ||
        "Sin razón especificada";

    await member.ban({
        reason
    });

    await message.reply(
        `🔨 <@${member.id}> fue baneado.\n` +
        `**Razón:** ${reason}`
    );

    await logAction(
        message.guild,
        "🔨 BAN",
        [
            `**Usuario:** ${member.user}`,
            `**ID:** \`${member.id}\``,
            `**Staff:** ${message.author}`,
            `**Razón:** ${reason}`
        ].join("\n")
    );
}

// ==========================================
// UNBAN
// ==========================================

async function unban(message, args) {
    if (!isStaff(message.member)) {
        return message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );
    }

    const userId =
        args[0]?.replace(/[<@!>]/g, "");

    if (!userId) {
        return message.reply(
            "❌ Debes proporcionar el ID del usuario."
        );
    }

    const user = await message.client.users
        .fetch(userId)
        .catch(() => null);

    if (!user) {
        return message.reply(
            "❌ No encontré ese usuario."
        );
    }

    await message.guild.members.unban(
        user.id,
        "Desbaneado por Staff"
    );

    await message.reply(
        `🔓 <@${user.id}> fue desbaneado.`
    );

    await logAction(
        message.guild,
        "🔓 UNBAN",
        [
            `**Usuario:** ${user}`,
            `**ID:** \`${user.id}\``,
            `**Staff:** ${message.author}`
        ].join("\n")
    );
}

// ==========================================
// PURGE
// ==========================================

async function purge(message, args) {
    if (!isStaff(message.member)) {
        return message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );
    }

    const amount = Number(args[0]);

    if (
        !Number.isInteger(amount) ||
        amount < 1 ||
        amount > 100
    ) {
        return message.reply(
            "❌ Usa una cantidad entre 1 y 100."
        );
    }

    const deleted =
        await message.channel.bulkDelete(
            amount,
            true
        );

    const confirmation =
        await message.channel.send(
            `🧹 Se eliminaron **${deleted.size} mensajes**.`
        );

    setTimeout(() => {
        confirmation.delete().catch(() => {});
    }, 3000);

    await logAction(
        message.guild,
        "🧹 PURGE",
        [
            `**Staff:** ${message.author}`,
            `**Canal:** ${message.channel}`,
            `**Mensajes:** ${deleted.size}`
        ].join("\n")
    );
}

// ==========================================
// LOCK
// ==========================================

async function lock(message) {
    if (!isStaff(message.member)) {
        return message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );
    }

    await message.channel.permissionOverwrites.edit(
        message.guild.roles.everyone,
        {
            SendMessages: false
        }
    );

    await message.reply(
        "🔒 Este canal ha sido bloqueado."
    );

    await logAction(
        message.guild,
        "🔒 LOCK",
        `**Staff:** ${message.author}\n**Canal:** ${message.channel}`
    );
}

// ==========================================
// UNLOCK
// ==========================================

async function unlock(message) {
    if (!isStaff(message.member)) {
        return message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );
    }

    await message.channel.permissionOverwrites.edit(
        message.guild.roles.everyone,
        {
            SendMessages: null
        }
    );

    await message.reply(
        "🔓 Este canal ha sido desbloqueado."
    );

    await logAction(
        message.guild,
        "🔓 UNLOCK",
        `**Staff:** ${message.author}\n**Canal:** ${message.channel}`
    );
}

// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    CONFIG,
    warnings,

    isStaff,
    getMember,

    warn,
    showWarnings,
    timeout,
    untimeout,
    kick,
    ban,
    unban,
    purge,
    lock,
    unlock
};
