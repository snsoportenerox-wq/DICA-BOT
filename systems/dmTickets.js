const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

// ==========================================
// CONFIGURACIÓN
// ==========================================

const CONFIG = {
    GUILD_ID: process.env.GUILD_ID,
    TICKET_CATEGORY: "1514355351712043141",
    STAFF_ROLE: "1540815218689441812",
    TICKET_LOGS: "1539791936058163241"
};

// ==========================================
// TICKETS MD ACTIVOS
// ==========================================

const dmTickets = new Map();

// ==========================================
// CREAR TICKET DESDE MD
// ==========================================

async function createDMTicket(message, client) {
    if (!message.author || message.author.bot) {
        return;
    }

    const guild = client.guilds.cache.get(CONFIG.GUILD_ID);

    if (!guild) {
        await message.reply(
            "❌ DICA Guard no pudo encontrar el servidor."
        ).catch(() => {});
        return;
    }

    // Si ya tiene un ticket MD
    if (dmTickets.has(message.author.id)) {
        const ticket = dmTickets.get(message.author.id);

        await message.reply(
            `🎫 Ya tienes un ticket abierto en DICA STUDIO.\n` +
            `Canal: <#${ticket.channelId}>`
        ).catch(() => {});

        return;
    }

    // ======================================
    // CREAR CANAL
    // ======================================

    const safeName = message.author.username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .slice(0, 50);

    const channel = await guild.channels.create({
        name: `md・${safeName}`,
        type: ChannelType.GuildText,
        parent: CONFIG.TICKET_CATEGORY,

        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [
                    PermissionFlagsBits.ViewChannel
                ]
            },
            {
                id: message.author.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            },
            {
                id: CONFIG.STAFF_ROLE,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            },
            {
                id: client.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels
                ]
            }
        ]
    });

    const ticketData = {
        channelId: channel.id,
        guildId: guild.id,
        userId: message.author.id,
        createdAt: Date.now(),
        claimedBy: null
    };

    dmTickets.set(
        message.author.id,
        ticketData
    );

    // ======================================
    // MENSAJE INICIAL
    // ======================================

    const embed = new EmbedBuilder()
        .setTitle("📩 Ticket recibido por MD")
        .setDescription(
            [
                "Se ha creado un ticket desde los mensajes directos.",
                "",
                `👤 **Usuario:** <@${message.author.id}>`,
                `🆔 **ID:** \`${message.author.id}\``,
                "",
                "💬 **Mensaje inicial:**",
                message.content || "[Sin texto]",
                "",
                `👮 <@&${CONFIG.STAFF_ROLE}>`,
                "Un miembro del Staff atenderá esta solicitud."
            ].join("\n")
        )
        .setTimestamp();

    await channel.send({
        content:
            `<@&${CONFIG.STAFF_ROLE}> ` +
            `📩 Nuevo ticket recibido por MD.`,
        embeds: [embed]
    });

    // ======================================
    // RESPUESTA AL USUARIO
    // ======================================

    await message.reply(
        "✅ Tu ticket ha sido creado correctamente en **DICA STUDIO**.\n" +
        "Un miembro del Staff te responderá por este mismo MD."
    ).catch(() => {});

    // ======================================
    // LOG
    // ======================================

    await logDM(
        guild,
        "📩 Ticket MD creado",
        [
            `**Usuario:** ${message.author}`,
            `**ID:** \`${message.author.id}\``,
            `**Canal:** <#${channel.id}>`
        ].join("\n")
    );
}

// ==========================================
// MENSAJE DEL USUARIO → TICKET
// ==========================================

async function forwardUserMessage(
    message,
    client
) {
    const ticket = dmTickets.get(
        message.author.id
    );

    if (!ticket) {
        return false;
    }

    const guild = client.guilds.cache.get(
        CONFIG.GUILD_ID
    );

    if (!guild) return false;

    const channel = guild.channels.cache.get(
        ticket.channelId
    );

    if (!channel) {
        dmTickets.delete(message.author.id);
        return false;
    }

    const embed = new EmbedBuilder()
        .setTitle("📩 Mensaje del usuario")
        .setDescription(
            message.content || "[Sin texto]"
        )
        .addFields(
            {
                name: "👤 Usuario",
                value: `${message.author}\n\`${message.author.id}\``
            }
        )
        .setTimestamp();

    await channel.send({
        embeds: [embed]
    });

    // Adjuntos
    if (message.attachments?.size) {
        for (const attachment of message.attachments.values()) {
            await channel.send({
                content:
                    `📎 **Archivo enviado por ${message.author.username}:**\n${attachment.url}`
            }).catch(() => {});
        }
    }

    return true;
}

// ==========================================
// RESPUESTA DEL STAFF → MD
// ==========================================

async function forwardStaffMessage(
    message,
    client
) {
    if (!message.guild) {
        return false;
    }

    const ticket = [...dmTickets.values()]
        .find(
            data =>
                data.channelId === message.channel.id
        );

    if (!ticket) {
        return false;
    }

    // Solo Staff
    if (
        !message.member?.roles?.cache?.has(
            CONFIG.STAFF_ROLE
        )
    ) {
        return false;
    }

    const user = await client.users
        .fetch(ticket.userId)
        .catch(() => null);

    if (!user) {
        return false;
    }

    const content = message.content?.trim();

    if (!content && !message.attachments?.size) {
        return false;
    }

    const embed = new EmbedBuilder()
        .setTitle("👮 DICA STUDIO • Staff")
        .setDescription(
            content || "[Mensaje sin texto]"
        )
        .setTimestamp();

    await user.send({
        embeds: [embed]
    }).catch(async () => {
        await message.channel.send(
            "⚠️ No pude enviar el mensaje por MD al usuario."
        ).catch(() => {});
    });

    // Adjuntos del Staff
    if (message.attachments?.size) {
        for (const attachment of message.attachments.values()) {
            await user.send({
                content:
                    `📎 **Archivo enviado por Staff:**\n${attachment.url}`
            }).catch(() => {});
        }
    }

    return true;
}

// ==========================================
// CERRAR TICKET MD
// ==========================================

async function closeDMTicket(
    channel,
    client
) {
    const ticket = [...dmTickets.entries()]
        .find(
            ([, data]) =>
                data.channelId === channel.id
        );

    if (!ticket) {
        return false;
    }

    const [userId] = ticket;

    const user = await client.users
        .fetch(userId)
        .catch(() => null);

    if (user) {
        await user.send(
            "🔒 Tu ticket de **DICA STUDIO** ha sido cerrado por el Staff."
        ).catch(() => {});
    }

    dmTickets.delete(userId);

    await logDM(
        channel.guild,
        "🔒 Ticket MD cerrado",
        [
            `**Usuario:** <@${userId}>`,
            `**Canal:** ${channel.name}`,
            `**ID:** \`${channel.id}\``
        ].join("\n")
    );

    return true;
}

// ==========================================
// LOG
// ==========================================

async function logDM(
    guild,
    title,
    description
) {
    const channel = guild.channels.cache.get(
        CONFIG.TICKET_LOGS
    );

    if (!channel) return;

    await channel.send({
        embeds: [
            new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setTimestamp()
        ]
    }).catch(() => {});
}

// ==========================================
// EXPORTAR
// ==========================================

module.exports = {
    CONFIG,
    dmTickets,

    createDMTicket,
    forwardUserMessage,
    forwardStaffMessage,
    closeDMTicket
};
