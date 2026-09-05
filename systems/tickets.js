const {
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const CONFIG = {
    GUILD_ID: process.env.GUILD_ID,

    TICKET_PANEL_CHANNEL: "1514355453742551102",
    TICKET_CATEGORY: "1514355351712043141",
    STAFF_ROLE: "1540815218689441812",
    TICKET_LOGS: "1539791936058163241"
};

// ======================================================
// EMOJIS
// ======================================================

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

// ======================================================
// CATEGORÍAS
// ======================================================

const CATEGORIES = [
    {
        id: "reporte",
        name: "Reporte",
        description:
            "Reporta usuarios, Staff u otros problemas relacionados con el servidor.",
        emoji: EMOJIS.reporte
    },

    {
        id: "alianza",
        name: "Alianza",
        description:
            "Solicita alianzas o colaboraciones con DICA STUDIO.",
        emoji: EMOJIS.alianza
    },

    {
        id: "soporte",
        name: "Soporte General",
        description:
            "Obtén ayuda con cualquier problema o consulta.",
        emoji: EMOJIS.soporte
    },

    {
        id: "postulacion",
        name: "Postulación",
        description:
            "Postúlate para formar parte del equipo de DICA STUDIO.",
        emoji: EMOJIS.postulacion
    }
];

// ======================================================
// TICKETS ACTIVOS
// ======================================================

const tickets = new Map();

// ======================================================
// CONVERTIR EMOJI DE DISCORD
// ======================================================

function parseEmoji(emoji) {
    if (!emoji) return undefined;

    const match = emoji.match(/^<(a?):([^:]+):(\d+)>$/);

    if (!match) {
        return {
            name: emoji
        };
    }

    return {
        id: match[3],
        name: match[2],
        animated: match[1] === "a"
    };
}

// ======================================================
// COMPROBAR STAFF
// ======================================================

function isStaff(member) {
    if (!member) return false;

    return (
        member.permissions?.has(PermissionFlagsBits.Administrator) ||
        member.roles?.cache?.has(CONFIG.STAFF_ROLE)
    );
}

// ======================================================
// BUSCAR TICKET
// ======================================================

function getTicket(channelId) {
    return tickets.get(channelId);
}

// ======================================================
// ENVIAR PANEL DE TICKETS
// ======================================================

async function sendTicketPanel(client) {
    try {
        const channel = await client.channels.fetch(
            CONFIG.TICKET_PANEL_CHANNEL
        );

        if (!channel) {
            console.error("❌ No se encontró el canal del panel de tickets.");
            return;
        }

        // ----------------------------------------------
        // EVITAR DUPLICADOS
        // ----------------------------------------------

        const messages = await channel.messages.fetch({
            limit: 50
        });

        const existingPanel = messages.find(
            message =>
                message.author?.id === client.user.id &&
                message.embeds?.some(
                    embed =>
                        embed.title ===
                        `${EMOJIS.loading} CENTRO DE SOPORTE`
                )
        );

        if (existingPanel) {
            console.log("🎫 Panel de tickets ya existe.");
            return;
        }

        // ----------------------------------------------
        // EMBED
        // ----------------------------------------------

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`${EMOJIS.loading} CENTRO DE SOPORTE`)
            .setDescription(
                `${EMOJIS.loading} **CENTRO DE SOPORTE**\n\n` +
                `Bienvenido al sistema oficial de soporte de **DICA STUDIO**.\n\n` +
                `Selecciona una categoría para abrir un ticket.\n\n` +

                `${EMOJIS.reporte} **Reporte**\n` +
                `Reporta usuarios, Staff u otros problemas relacionados con el servidor.\n\n` +

                `${EMOJIS.alianza} **Alianza**\n` +
                `Solicita alianzas o colaboraciones con DICA STUDIO.\n\n` +

                `${EMOJIS.soporte} **Soporte General**\n` +
                `Obtén ayuda con cualquier problema o consulta.\n\n` +

                `${EMOJIS.postulacion} **Postulación**\n` +
                `Postúlate para formar parte del equipo de DICA STUDIO.`
            );

        // ----------------------------------------------
        // SELECT MENU
        // ----------------------------------------------

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("dica_ticket_category")
            .setPlaceholder("Selecciona una categoría...")
            .addOptions(
                CATEGORIES.map(category => ({
                    label: category.name,
                    description: category.description,
                    value: category.id,

                    // IMPORTANTE:
                    // Discord necesita el objeto completo del emoji.
                    emoji: parseEmoji(category.emoji)
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // ----------------------------------------------
        // ENVIAR
        // ----------------------------------------------

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        console.log("✅ Panel de tickets enviado correctamente.");

    } catch (error) {
        console.error("❌ Error en panel de tickets:", error);
    }
}

// ======================================================
// CREAR TICKET
// ======================================================

async function createTicket(interaction, categoryId, client) {
    try {
        const guild = interaction.guild;

        if (!guild) {
            return interaction.reply({
                content: "❌ Este sistema solo funciona dentro del servidor.",
                ephemeral: true
            });
        }

        const category = CATEGORIES.find(
            c => c.id === categoryId
        );

        if (!category) {
            return interaction.reply({
                content: "❌ Categoría inválida.",
                ephemeral: true
            });
        }

        // ----------------------------------------------
        // COMPROBAR TICKET EXISTENTE
        // ----------------------------------------------

        const existingTicket = [...tickets.values()].find(
            ticket =>
                ticket.userId === interaction.user.id
        );

        if (existingTicket) {
            const existingChannel =
                guild.channels.cache.get(existingTicket.channelId);

            if (existingChannel) {
                return interaction.reply({
                    content: `❌ Ya tienes un ticket abierto: ${existingChannel}`,
                    ephemeral: true
                });
            }

            tickets.delete(existingTicket.channelId);
        }

        // ----------------------------------------------
        // CREAR CANAL
        // ----------------------------------------------

        const channel = await guild.channels.create({
            name: `ticket・${interaction.user.username}`
                .toLowerCase()
                .replace(/[^a-z0-9・_-]/g, "")
                .slice(0, 90),

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
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ]
                },

                {
                    id: CONFIG.STAFF_ROLE,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ManageMessages
                    ]
                },

                {
                    id: client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.ManageMessages,
                        PermissionFlagsBits.AttachFiles
                    ]
                }
            ]
        });

        // ----------------------------------------------
        // GUARDAR TICKET
        // ----------------------------------------------

        const ticketData = {
            channelId: channel.id,
            userId: interaction.user.id,
            username: interaction.user.username,
            category: category.name,
            categoryId: category.id,
            claimedBy: null,
            createdAt: new Date(),
            actions: []
        };

        tickets.set(channel.id, ticketData);

        // ----------------------------------------------
        // EMBED DEL TICKET
        // ----------------------------------------------

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(
                `${category.emoji} ${category.name}`
            )
            .setDescription(
                `Bienvenido a tu ticket de **${category.name}**.\n\n` +
                `👤 **Usuario:** ${interaction.user}\n` +
                `📁 **Categoría:** ${category.name}\n\n` +
                `${EMOJIS.staff} El equipo de Staff será notificado y te atenderá lo antes posible.`
            )
            .setTimestamp();

        // ----------------------------------------------
        // BOTONES
        // ----------------------------------------------

        const buttons = new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId("dica_ticket_add")
                .setLabel("Añadir usuario")
                .setEmoji(parseEmoji(EMOJIS.add))
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("dica_ticket_claim")
                .setLabel("Reclamar")
                .setEmoji(parseEmoji(EMOJIS.claim))
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("dica_ticket_release")
                .setLabel("Liberar")
                .setEmoji(parseEmoji(EMOJIS.release))
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("dica_ticket_close")
                .setLabel("Cerrar")
                .setEmoji(parseEmoji(EMOJIS.close))
                .setStyle(ButtonStyle.Danger)
        );

        // ----------------------------------------------
        // MENSAJE
        // ----------------------------------------------

        await channel.send({
            content: `<@&${CONFIG.STAFF_ROLE}>`,
            embeds: [embed],
            components: [buttons],
            allowedMentions: {
                roles: [CONFIG.STAFF_ROLE]
            }
        });

        await interaction.reply({
            content: `✅ Tu ticket ha sido creado: ${channel}`,
            ephemeral: true
        });

        console.log(
            `🎫 Ticket creado: ${channel.name} | ${interaction.user.tag}`
        );

    } catch (error) {
        console.error("❌ Error creando ticket:", error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content:
                    "❌ Ocurrió un error al crear el ticket.",
                ephemeral: true
            }).catch(() => {});
        }
    }
}

// ======================================================
// RECLAMAR TICKET
// ======================================================

async function claimTicket(channel, member, interaction) {
    const ticket = tickets.get(channel.id);

    if (!ticket) {
        return interaction.reply({
            content:
                "❌ Este comando solo puede utilizarse dentro de un ticket.",
            ephemeral: true
        });
    }

    if (!isStaff(member)) {
        return interaction.reply({
            content: "❌ No tienes permisos para reclamar tickets.",
            ephemeral: true
        });
    }

    if (ticket.claimedBy) {
        return interaction.reply({
            content:
                `❌ Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`,
            ephemeral: true
        });
    }

    ticket.claimedBy = member.id;

    ticket.actions.push({
        type: "claim",
        userId: member.id,
        timestamp: new Date()
    });

    await interaction.reply({
        content:
            `${EMOJIS.claim} ${member} ha reclamado este ticket.`,
        allowedMentions: {
            users: [member.id]
        }
    });
}

// ======================================================
// LIBERAR TICKET
// ======================================================

async function releaseTicket(channel, member, interaction) {
    const ticket = tickets.get(channel.id);

    if (!ticket) {
        return interaction.reply({
            content:
                "❌ Este comando solo puede utilizarse dentro de un ticket.",
            ephemeral: true
        });
    }

    if (!isStaff(member)) {
        return interaction.reply({
            content: "❌ No tienes permisos.",
            ephemeral: true
        });
    }

    if (!ticket.claimedBy) {
        return interaction.reply({
            content: "❌ Este ticket no está reclamado.",
            ephemeral: true
        });
    }

    if (ticket.claimedBy !== member.id) {
        return interaction.reply({
            content:
                "❌ Solo el Staff que reclamó el ticket puede liberarlo.",
            ephemeral: true
        });
    }

    ticket.actions.push({
        type: "release",
        userId: member.id,
        timestamp: new Date()
    });

    ticket.claimedBy = null;

    await interaction.reply({
        content:
            `${EMOJIS.release} ${member} ha liberado el ticket.`
    });
}

// ======================================================
// AÑADIR USUARIO
// ======================================================

async function addUserToTicket(channel, member, user, interaction) {
    const ticket = tickets.get(channel.id);

    if (!ticket) {
        return interaction.reply({
            content:
                "❌ Este comando solo puede utilizarse dentro de un ticket.",
            ephemeral: true
        });
    }

    if (!isStaff(member)) {
        return interaction.reply({
            content: "❌ Solo Staff puede añadir usuarios.",
            ephemeral: true
        });
    }

    if (!user) {
        return interaction.reply({
            content: "❌ Debes mencionar a un usuario.",
            ephemeral: true
        });
    }

    await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true
    });

    ticket.actions.push({
        type: "add_user",
        userId: user.id,
        by: member.id,
        timestamp: new Date()
    });

    await interaction.reply({
        content:
            `${EMOJIS.add} ${user} fue añadido al ticket.`,
        allowedMentions: {
            users: [user.id]
        }
    });
}

// ======================================================
// CERRAR TICKET
// ======================================================

async function closeTicket(channel, member, interaction, transcriptCallback, client) {
    const ticket = tickets.get(channel.id);

    if (!ticket) {
        return interaction.reply({
            content:
                "❌ Este comando solo puede utilizarse dentro de un ticket.",
            ephemeral: true
        });
    }

    if (!isStaff(member) && ticket.userId !== member.id) {
        return interaction.reply({
            content:
                "❌ No tienes permisos para cerrar este ticket.",
            ephemeral: true
        });
    }

    await interaction.reply({
        content:
            `${EMOJIS.close} Cerrando ticket...`
    });

    ticket.closedBy = member.id;
    ticket.closedAt = new Date();

    ticket.actions.push({
        type: "close",
        userId: member.id,
        timestamp: new Date()
    });

    // ----------------------------------------------
    // TRANSCRIPT
    // ----------------------------------------------

    let transcript = null;

    if (typeof transcriptCallback === "function") {
        try {
            transcript = await transcriptCallback(
                channel,
                ticket
            );
        } catch (error) {
            console.error(
                "❌ Error generando transcript:",
                error
            );
        }
    }

    // ----------------------------------------------
    // LOGS
    // ----------------------------------------------

    try {
        const logs = await client.channels.fetch(
            CONFIG.TICKET_LOGS
        );

        if (logs) {
            const logEmbed = new EmbedBuilder()
                .setColor(0xed4245)
                .setTitle(`${EMOJIS.close} Ticket cerrado`)
                .addFields(
                    {
                        name: "👤 Usuario",
                        value: `<@${ticket.userId}>`,
                        inline: true
                    },
                    {
                        name: "👮 Cerrado por",
                        value: `<@${member.id}>`,
                        inline: true
                    },
                    {
                        name: "📁 Categoría",
                        value: ticket.category,
                        inline: true
                    }
                )
                .setTimestamp();

            await logs.send({
                embeds: [logEmbed],
                files: transcript ? [transcript] : []
            });
        }
    } catch (error) {
        console.error(
            "❌ Error enviando logs del ticket:",
            error
        );
    }

    // ----------------------------------------------
    // DM AL USUARIO
    // ----------------------------------------------

    try {
        const user = await client.users.fetch(
            ticket.userId
        );

        if (user) {
            const dmEmbed = new EmbedBuilder()
                .setColor(0x57f287)
                .setTitle("🎫 Ticket cerrado")
                .setDescription(
                    `Tu ticket de **${ticket.category}** en **DICA STUDIO** ha sido cerrado.\n\n` +
                    `👮 Cerrado por: <@${member.id}>\n\n` +
                    `Gracias por contactar con el equipo de soporte.`
                )
                .setTimestamp();

            await user.send({
                embeds: [dmEmbed],
                files: transcript ? [transcript] : []
            }).catch(() => {});
        }
    } catch (error) {
        console.error(
            "❌ Error enviando DM del ticket:",
            error
        );
    }

    // ----------------------------------------------
    // ELIMINAR
    // ----------------------------------------------

    tickets.delete(channel.id);

    setTimeout(async () => {
        await channel.delete(
            "Ticket cerrado"
        ).catch(() => {});
    }, 3000);
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    CONFIG,
    EMOJIS,
    CATEGORIES,
    tickets,

    parseEmoji,
    isStaff,
    getTicket,

    sendTicketPanel,
    createTicket,

    claimTicket,
    releaseTicket,
    addUserToTicket,
    closeTicket
};
