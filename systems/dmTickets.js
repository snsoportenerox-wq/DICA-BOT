const {
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const CONFIG = {
    GUILD_ID: process.env.GUILD_ID,
    TICKET_CATEGORY: "1514355351712043141",
    STAFF_ROLE: "1540815218689441812",
    TICKET_LOGS: "1539791936058163241"
};

const EMOJIS = {
    add: "<a:GTALoading:1526788751563558965>",
    claim: "<a:4731verifiedred:1533478086333567087>",
    release: "<a:emoji_235:1538333225066307654>",
    close: "<a:31white_x:1505680012177834235>"
};

// Usuario ID → información del ticket MD
const dmTickets = new Map();

// Canal ID → usuario ID
const channelToUser = new Map();

// Canal ID → Staff que reclamó
const claimedTickets = new Map();


function isStaff(member) {
    if (!member) return false;

    return (
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.roles.cache.has(CONFIG.STAFF_ROLE)
    );
}


function getButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("dica_ticket_add")
            .setLabel("Añadir usuario")
            .setEmoji(EMOJIS.add)
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("dica_ticket_claim")
            .setLabel("Reclamar")
            .setEmoji(EMOJIS.claim)
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId("dica_ticket_release")
            .setLabel("Liberar")
            .setEmoji(EMOJIS.release)
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("dica_ticket_close")
            .setLabel("Cerrar")
            .setEmoji(EMOJIS.close)
            .setStyle(ButtonStyle.Danger)
    );
}


async function createDMTicket(user, client) {
    try {
        const guild = await client.guilds.fetch(CONFIG.GUILD_ID);

        if (!guild) {
            console.error("❌ No se encontró el servidor configurado.");
            return null;
        }

        // Si ya existe
        if (dmTickets.has(user.id)) {
            return dmTickets.get(user.id);
        }

        const category = await guild.channels.fetch(CONFIG.TICKET_CATEGORY);

        if (!category) {
            console.error("❌ No se encontró la categoría de tickets MD.");
            return null;
        }

        // Nombre seguro
        let username = user.username
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "")
            .slice(0, 70);

        if (!username) username = "usuario";

        const channel = await guild.channels.create({
            name: `md・${username}`,
            type: ChannelType.GuildText,
            parent: CONFIG.TICKET_CATEGORY,

            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
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
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
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
            userId: user.id,
            username: user.username,
            channelId: channel.id,
            createdAt: Date.now(),
            claimedBy: null,
            type: "dm"
        };

        dmTickets.set(user.id, ticketData);
        channelToUser.set(channel.id, user.id);

        const embed = new EmbedBuilder()
            .setTitle("📩 TICKET POR MD")
            .setDescription(
                `Un usuario ha contactado con **DICA STUDIO** mediante mensaje directo.\n\n` +
                `👤 **Usuario:** ${user}\n` +
                `🆔 **ID:** \`${user.id}\`\n\n` +
                `El Staff puede responder directamente desde este canal.`
            )
            .setTimestamp()
            .setFooter({
                text: "DICA Guard • DICA STUDIO"
            });

        await channel.send({
            content: `<@&${CONFIG.STAFF_ROLE}>`,
            embeds: [embed],
            components: [getButtons()]
        });

        await user.send(
            "🎫 **Tu ticket ha sido creado correctamente.**\n\n" +
            "Un miembro del Staff de DICA STUDIO te atenderá pronto."
        ).catch(() => {});

        console.log(`📩 Ticket MD creado: ${channel.name}`);

        return ticketData;

    } catch (error) {
        console.error("❌ Error creando ticket MD:", error);
        return null;
    }
}


async function forwardUserMessage(message, client) {
    if (!message || message.author?.bot) return;

    const userId = message.author.id;

    let ticket = dmTickets.get(userId);

    if (!ticket) {
        ticket = await createDMTicket(message.author, client);
    }

    if (!ticket) return;

    const channel = await client.channels
        .fetch(ticket.channelId)
        .catch(() => null);

    if (!channel) return;

    const content = message.content || "*[Sin texto]*";

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `${message.author.username} • MD`,
            iconURL: message.author.displayAvatarURL()
        })
        .setDescription(content.slice(0, 4000))
        .setTimestamp();

    if (message.attachments.size > 0) {
        embed.addFields({
            name: "📎 Archivos",
            value: message.attachments
                .map(a => `[${a.name}](${a.url})`)
                .join("\n")
                .slice(0, 1024)
        });
    }

    await channel.send({
        embeds: [embed]
    });

    // Avisar al Staff solo cuando llega un mensaje nuevo
    await channel.send({
        content: `<@&${CONFIG.STAFF_ROLE}>`,
        allowedMentions: {
            roles: [CONFIG.STAFF_ROLE]
        }
    }).catch(() => {});
}


async function forwardStaffMessage(message, client) {
    if (!message || message.author?.bot) return;

    const channelId = message.channel?.id;

    if (!channelId) return;

    const userId = channelToUser.get(channelId);

    if (!userId) return;

    const ticket = dmTickets.get(userId);

    if (!ticket) return;

    // Solo mensajes de Staff
    if (!isStaff(message.member)) return;

    const user = await client.users
        .fetch(userId)
        .catch(() => null);

    if (!user) return;

    const content = message.content || "*[Sin texto]*";

    let finalMessage =
        `👮 **Staff de DICA STUDIO**\n\n${content}`;

    if (message.attachments.size > 0) {
        finalMessage +=
            "\n\n📎 **Archivos:**\n" +
            message.attachments
                .map(a => a.url)
                .join("\n");
    }

    await user.send(finalMessage).catch(() => {});
}


async function claimDMTicket(channel, member, interaction) {
    if (!isStaff(member)) {
        return interaction.reply({
            content: "❌ No tienes permisos para reclamar tickets.",
            ephemeral: true
        });
    }

    const userId = channelToUser.get(channel.id);

    if (!userId) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket por MD.",
            ephemeral: true
        });
    }

    const alreadyClaimed = claimedTickets.get(channel.id);

    if (alreadyClaimed) {
        if (alreadyClaimed === member.id) {
            return interaction.reply({
                content: "⚠️ Ya tienes reclamado este ticket.",
                ephemeral: true
            });
        }

        return interaction.reply({
            content: `❌ Este ticket ya fue reclamado por <@${alreadyClaimed}>.`,
            ephemeral: true
        });
    }

    claimedTickets.set(channel.id, member.id);

    const ticket = dmTickets.get(userId);

    if (ticket) {
        ticket.claimedBy = member.id;
        dmTickets.set(userId, ticket);
    }

    await channel.send({
        content: `🎯 **Ticket reclamado por ${member}.**`
    });

    return interaction.reply({
        content: "✅ Has reclamado este ticket correctamente.",
        ephemeral: true
    });
}


async function releaseDMTicket(channel, member, interaction) {
    if (!isStaff(member)) {
        return interaction.reply({
            content: "❌ No tienes permisos para liberar tickets.",
            ephemeral: true
        });
    }

    const claimedBy = claimedTickets.get(channel.id);

    if (!claimedBy) {
        return interaction.reply({
            content: "⚠️ Este ticket no está reclamado.",
            ephemeral: true
        });
    }

    if (claimedBy !== member.id) {
        return interaction.reply({
            content: "❌ Solo el Staff que reclamó este ticket puede liberarlo.",
            ephemeral: true
        });
    }

    claimedTickets.delete(channel.id);

    const userId = channelToUser.get(channel.id);
    const ticket = dmTickets.get(userId);

    if (ticket) {
        ticket.claimedBy = null;
        dmTickets.set(userId, ticket);
    }

    await channel.send({
        content: `🔓 **Ticket liberado por ${member}.**`
    });

    return interaction.reply({
        content: "✅ Ticket liberado correctamente.",
        ephemeral: true
    });
}


async function closeDMTicket(channel, member, interaction, transcriptCallback, client) {
    if (!isStaff(member)) {
        return interaction.reply({
            content: "❌ No tienes permisos para cerrar este ticket.",
            ephemeral: true
        });
    }

    const userId = channelToUser.get(channel.id);

    if (!userId) {
        return interaction.reply({
            content: "❌ No se encontró el usuario de este ticket.",
            ephemeral: true
        });
    }

    const ticket = dmTickets.get(userId);

    await interaction.reply({
        content: "🔒 Cerrando ticket y generando transcript...",
        ephemeral: true
    });

    // Generar transcript
    let transcript = null;

    if (typeof transcriptCallback === "function") {
        try {
            transcript = await transcriptCallback(channel, {
                userId,
                category: "MD",
                claimedBy: ticket?.claimedBy || null,
                createdAt: ticket?.createdAt || Date.now(),
                closedAt: Date.now()
            });
        } catch (error) {
            console.error("❌ Error generando transcript MD:", error);
        }
    }

    // Logs
    const logs = await client.channels
        .fetch(CONFIG.TICKET_LOGS)
        .catch(() => null);

    if (logs) {
        const logEmbed = new EmbedBuilder()
            .setTitle("🔒 TICKET MD CERRADO")
            .addFields(
                {
                    name: "👤 Usuario",
                    value: `<@${userId}>`,
                    inline: true
                },
                {
                    name: "👮 Cerrado por",
                    value: `${member}`,
                    inline: true
                },
                {
                    name: "🎫 Canal",
                    value: `#${channel.name}`,
                    inline: true
                }
            )
            .setTimestamp();

        const payload = {
            embeds: [logEmbed]
        };

        if (transcript) {
            if (Array.isArray(transcript)) {
                payload.files = transcript;
            } else {
                payload.files = [transcript];
            }
        }

        await logs.send(payload).catch(error => {
            console.error("❌ Error enviando log MD:", error);
        });
    }

    // Avisar al usuario
    const user = await client.users
        .fetch(userId)
        .catch(() => null);

    if (user) {
        await user.send(
            "🔒 **Tu ticket de DICA STUDIO ha sido cerrado.**\n\n" +
            "Si necesitas ayuda nuevamente, puedes escribirnos por MD."
        ).catch(() => {});
    }

    // Limpiar memoria
    dmTickets.delete(userId);
    channelToUser.delete(channel.id);
    claimedTickets.delete(channel.id);

    // Eliminar canal
    setTimeout(async () => {
        await channel.delete("Ticket MD cerrado por Staff").catch(() => {});
    }, 1500);
}


module.exports = {
    CONFIG,
    dmTickets,
    channelToUser,
    claimedTickets,
    isStaff,
    createDMTicket,
    forwardUserMessage,
    forwardStaffMessage,
    claimDMTicket,
    releaseDMTicket,
    closeDMTicket
};
