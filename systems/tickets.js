const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require("discord.js");

// ==============================
// CONFIGURACIÓN
// ==============================

const CONFIG = {
    GUILD_ID: process.env.GUILD_ID,

    TICKET_PANEL_CHANNEL: "1514355453742551102",
    TICKET_CATEGORY: "1514355351712043141",

    STAFF_ROLE: "1540815218689441812",

    TICKET_LOGS: "1539791936058163241"
};

// ==============================
// EMOJIS
// ==============================

const EMOJIS = {
    loading: "<a:GTALoading:1526788751563558965>",
    reporte: "<a:warning:1334727653969756170>",
    alianza: "<a:93619jumpingstar:1533480218411401296>",
    soporte: "<:verified:710970919736311942>",
    postulacion: "<a:Crown_pink:1264023212673466379>",

    add: "<a:GTALoading:1526788751563558965>",
    claim: "<a:4731verifiedred:1533478086333567087>",
    release: "<a:emoji_235:1538333225066307654>",
    close: "<a:31white_x:1505680012177834235>",
    staff: "<:discord_staff:893226951085543455>"
};

// ==============================
// CATEGORÍAS
// ==============================

const CATEGORIES = {
    reporte: {
        name: "Reporte",
        emoji: EMOJIS.reporte,
        description: "Reporta usuarios, Staff u otros problemas relacionados con el servidor."
    },

    alianza: {
        name: "Alianza",
        emoji: EMOJIS.alianza,
        description: "Solicita alianzas o colaboraciones con DICA STUDIO."
    },

    soporte: {
        name: "Soporte General",
        emoji: EMOJIS.soporte,
        description: "Obtén ayuda con cualquier problema o consulta."
    },

    postulacion: {
        name: "Postulación",
        emoji: EMOJIS.postulacion,
        description: "Postúlate para formar parte del equipo de DICA STUDIO."
    }
};

// ==============================
// MEMORIA DE TICKETS
// ==============================

const tickets = new Map();

// ==============================
// PANEL PRINCIPAL
// ==============================

async function sendTicketPanel(guild) {
    const channel = guild.channels.cache.get(
        CONFIG.TICKET_PANEL_CHANNEL
    );

    if (!channel) {
        console.log("❌ No se encontró el canal del panel de tickets.");
        return;
    }

    // Evitar duplicados
    const messages = await channel.messages.fetch({ limit: 50 });

    const alreadyExists = messages.some(
        msg =>
            msg.author.id === guild.client.user.id &&
            msg.components?.some(row =>
                row.components?.some(component =>
                    component.customId === "dica_ticket_select"
                )
            )
    );

    if (alreadyExists) {
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.loading} CENTRO DE SOPORTE`)
        .setDescription(
            [
                "Bienvenido al sistema oficial de soporte de **DICA STUDIO**.",
                "",
                "Selecciona una categoría para abrir un ticket.",
                "",
                `${EMOJIS.reporte} **Reporte**`,
                "Reporta usuarios, Staff u otros problemas relacionados con el servidor.",
                "",
                `${EMOJIS.alianza} **Alianza**`,
                "Solicita alianzas o colaboraciones con DICA STUDIO.",
                "",
                `${EMOJIS.soporte} **Soporte General**`,
                "Obtén ayuda con cualquier problema o consulta.",
                "",
                `${EMOJIS.postulacion} **Postulación**`,
                "Postúlate para formar parte del equipo de DICA STUDIO."
            ].join("\n")
        );

    const select = new StringSelectMenuBuilder()
        .setCustomId("dica_ticket_select")
        .setPlaceholder("Selecciona una categoría")
        .addOptions(
            Object.entries(CATEGORIES).map(([value, category]) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(category.name)
                    .setDescription(category.description)
                    .setValue(value)
                    .setEmoji(
                        category.emoji
                            .replace(/<a?:([^:]+):\d+>/, "$1")
                    )
            )
        );

    const row = new ActionRowBuilder().addComponents(select);

    await channel.send({
        embeds: [embed],
        components: [row]
    });

    console.log("✅ Panel de tickets enviado.");
}

// ==============================
// CREAR TICKET
// ==============================

async function createTicket(interaction, categoryKey) {
    const guild = interaction.guild;
    const user = interaction.user;

    if (!guild) return;

    // Comprobar si ya tiene ticket
    const existing = [...tickets.values()].find(
        ticket =>
            ticket.guildId === guild.id &&
            ticket.userId === user.id
    );

    if (existing) {
        return interaction.reply({
            content: `❌ Ya tienes un ticket abierto: <#${existing.channelId}>`,
            ephemeral: true
        });
    }

    const category = CATEGORIES[categoryKey];

    if (!category) {
        return interaction.reply({
            content: "❌ Categoría inválida.",
            ephemeral: true
        });
    }

    const ticketName =
        `${EMOJIS.loading}・${user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9\-・]/gi, "-")
            .slice(0, 90);

    const channel = await guild.channels.create({
        name: ticketName,
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
                id: user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks
                ]
            },
            {
                id: CONFIG.STAFF_ROLE,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.ManageMessages
                ]
            },
            {
                id: guild.client.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.ManageMessages
                ]
            }
        ]
    });

    tickets.set(channel.id, {
        channelId: channel.id,
        guildId: guild.id,
        userId: user.id,
        category: categoryKey,
        categoryName: category.name,
        claimedBy: null,
        createdAt: Date.now()
    });

    const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.loading} Ticket de ${user.username}`)
        .setDescription(
            [
                `Bienvenido a tu ticket de **${category.name}**.`,
                "",
                category.description,
                "",
                `${EMOJIS.staff} <@&${CONFIG.STAFF_ROLE}>`,
                "Un miembro del Staff atenderá tu solicitud.",
                "",
                `👤 **Usuario:** <@${user.id}>`,
                `📂 **Categoría:** ${category.name}`
            ].join("\n")
        )
        .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_add")
            .setLabel("Añadir usuario")
            .setEmoji(EMOJIS.add)
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("ticket_claim")
            .setLabel("Reclamar")
            .setEmoji(EMOJIS.claim)
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId("ticket_release")
            .setLabel("Liberar")
            .setEmoji(EMOJIS.release)
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("Cerrar")
            .setEmoji(EMOJIS.close)
            .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
        content: `<@&${CONFIG.STAFF_ROLE}> <@${user.id}>`,
        embeds: [embed],
        components: [buttons]
    });

    await interaction.reply({
        content: `✅ Tu ticket ha sido creado: <#${channel.id}>`,
        ephemeral: true
    });

    await logTicket(
        guild,
        `🎫 Ticket creado`,
        [
            `**Usuario:** <@${user.id}>`,
            `**Categoría:** ${category.name}`,
            `**Canal:** <#${channel.id}>`
        ].join("\n")
    );
}

// ==============================
// RECLAMAR
// ==============================

async function claimTicket(interaction) {
    const ticket = tickets.get(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket de DICA Guard.",
            ephemeral: true
        });
    }

    if (!isStaff(interaction)) {
        return interaction.reply({
            content: "❌ Solo el Staff puede reclamar tickets.",
            ephemeral: true
        });
    }

    if (ticket.claimedBy) {
        return interaction.reply({
            content: `❌ Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`,
            ephemeral: true
        });
    }

    ticket.claimedBy = interaction.user.id;

    await interaction.reply({
        content:
            `${EMOJIS.staff} **Ticket reclamado**\n` +
            `Staff responsable: <@${interaction.user.id}>`
    });

    await logTicket(
        interaction.guild,
        "🟢 Ticket reclamado",
        `**Staff:** <@${interaction.user.id}>\n**Canal:** <#${interaction.channel.id}>`
    );
}

// ==============================
// LIBERAR
// ==============================

async function releaseTicket(interaction) {
    const ticket = tickets.get(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket.",
            ephemeral: true
        });
    }

    if (!isStaff(interaction)) {
        return interaction.reply({
            content: "❌ Solo el Staff puede liberar tickets.",
            ephemeral: true
        });
    }

    if (!ticket.claimedBy) {
        return interaction.reply({
            content: "❌ Este ticket no está reclamado.",
            ephemeral: true
        });
    }

    if (ticket.claimedBy !== interaction.user.id) {
        return interaction.reply({
            content: "❌ Solo el Staff que reclamó el ticket puede liberarlo.",
            ephemeral: true
        });
    }

    ticket.claimedBy = null;

    await interaction.reply({
        content:
            `🔓 **Ticket liberado**\n` +
            `Liberado por <@${interaction.user.id}>.\n\n` +
            `${EMOJIS.staff} <@&${CONFIG.STAFF_ROLE}> este ticket está disponible para otro Staff.`
    });

    await logTicket(
        interaction.guild,
        "🔓 Ticket liberado",
        `**Staff:** <@${interaction.user.id}>\n**Canal:** <#${interaction.channel.id}>`
    );
}

// ==============================
// AÑADIR USUARIO
// ==============================

async function addUserToTicket(interaction, userId) {
    const ticket = tickets.get(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket.",
            ephemeral: true
        });
    }

    if (!isStaff(interaction)) {
        return interaction.reply({
            content: "❌ Solo el Staff puede añadir usuarios.",
            ephemeral: true
        });
    }

    const user = await interaction.client.users.fetch(userId)
        .catch(() => null);

    if (!user) {
        return interaction.reply({
            content: "❌ No encontré ese usuario.",
            ephemeral: true
        });
    }

    await interaction.channel.permissionOverwrites.edit(
        user.id,
        {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true,
            EmbedLinks: true
        }
    );

    await interaction.reply({
        content: `✅ <@${user.id}> fue añadido al ticket.`
    });

    await logTicket(
        interaction.guild,
        "➕ Usuario añadido",
        `**Staff:** <@${interaction.user.id}>\n**Usuario:** <@${user.id}>\n**Canal:** <#${interaction.channel.id}>`
    );
}

// ==============================
// CERRAR TICKET
// ==============================

async function closeTicket(interaction, generateTranscript) {
    const ticket = tickets.get(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket.",
            ephemeral: true
        });
    }

    if (!isStaff(interaction)) {
        return interaction.reply({
            content: "❌ Solo el Staff puede cerrar tickets.",
            ephemeral: true
        });
    }

    await interaction.reply({
        content: "🔒 Cerrando ticket y generando transcripción..."
    });

    let transcript = null;

    if (typeof generateTranscript === "function") {
        transcript = await generateTranscript(
            interaction.channel,
            ticket
        ).catch(() => null);
    }

    const logs = interaction.guild.channels.cache.get(
        CONFIG.TICKET_LOGS
    );

    if (logs) {
        const logEmbed = new EmbedBuilder()
            .setTitle("🔒 Ticket cerrado")
            .setDescription(
                [
                    `**Usuario:** <@${ticket.userId}>`,
                    `**Categoría:** ${ticket.categoryName}`,
                    `**Staff:** <@${interaction.user.id}>`,
                    `**Canal:** ${interaction.channel.name}`,
                    `**ID:** ${interaction.channel.id}`
                ].join("\n")
            )
            .setTimestamp();

        const messageData = {
            embeds: [logEmbed]
        };

        if (transcript) {
            messageData.files = [transcript];
        }

        await logs.send(messageData).catch(console.error);
    }

    // Intentar enviar transcript por MD
    if (transcript) {
        const user = await interaction.client.users
            .fetch(ticket.userId)
            .catch(() => null);

        if (user) {
            await user.send({
                content: "📄 **Transcripción de tu ticket de DICA STUDIO**",
                files: [transcript]
            }).catch(() => {});
        }
    }

    tickets.delete(interaction.channel.id);

    setTimeout(async () => {
        await interaction.channel.delete(
            "Ticket cerrado por Staff"
        ).catch(() => {});
    }, 3000);
}

// ==============================
// UTILIDADES
// ==============================

function isStaff(interaction) {
    return interaction.member?.roles?.cache?.has(
        CONFIG.STAFF_ROLE
    );
}

async function logTicket(guild, title, description) {
    const channel = guild.channels.cache.get(
        CONFIG.TICKET_LOGS
    );

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();

    await channel.send({
        embeds: [embed]
    }).catch(() => {});
}

// ==============================
// EXPORTAR
// ==============================

module.exports = {
    CONFIG,
    CATEGORIES,
    tickets,

    sendTicketPanel,
    createTicket,
    claimTicket,
    releaseTicket,
    addUserToTicket,
    closeTicket,
    isStaff
};
