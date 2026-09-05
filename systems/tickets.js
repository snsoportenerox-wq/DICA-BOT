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

const CATEGORIES = [
    {
        id: "reporte",
        label: "Reporte",
        description: "Reporta usuarios, Staff u otros problemas.",
        emoji: EMOJIS.reporte
    },
    {
        id: "alianza",
        label: "Alianza",
        description: "Solicita alianzas o colaboraciones.",
        emoji: EMOJIS.alianza
    },
    {
        id: "soporte",
        label: "Soporte General",
        description: "Obtén ayuda con cualquier problema o consulta.",
        emoji: EMOJIS.soporte
    },
    {
        id: "postulacion",
        label: "Postulación",
        description: "Postúlate para formar parte del equipo.",
        emoji: EMOJIS.postulacion
    }
];

// Memoria de tickets
const tickets = new Map();


/* =========================================================
   EMOJIS
========================================================= */

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


/* =========================================================
   PERMISOS
========================================================= */

function isStaff(member) {
    if (!member) return false;

    return (
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.roles.cache.has(CONFIG.STAFF_ROLE)
    );
}


/* =========================================================
   BOTONES
========================================================= */

function getTicketButtons() {
    return new ActionRowBuilder().addComponents(

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
}


/* =========================================================
   PANEL PRINCIPAL
========================================================= */

async function sendTicketPanel(client) {
    try {
        const channel = await client.channels.fetch(
            CONFIG.TICKET_PANEL_CHANNEL
        );

        if (!channel) {
            console.error("❌ No se encontró el canal del panel de tickets.");
            return;
        }

        const messages = await channel.messages.fetch({
            limit: 50
        });

        const existingPanel = messages.find(message =>
            message.author?.id === client.user.id &&
            message.content?.includes("CENTRO DE SOPORTE") &&
            message.components?.some(row =>
                row.components?.some(component =>
                    component.customId === "dica_ticket_category"
                )
            )
        );

        if (existingPanel) {
            console.log("🎫 Panel de tickets ya existe.");
            return;
        }

        /*
         * IMPORTANTE:
         * El panel principal se envía como CONTENT y no como
         * embed para que los emojis personalizados del texto
         * se procesen correctamente.
         */

        const panelContent = [
            `${EMOJIS.loading} **CENTRO DE SOPORTE**`,
            "",
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
        ].join("\n");

        const menu = new StringSelectMenuBuilder()
            .setCustomId("dica_ticket_category")
            .setPlaceholder("🎫 Selecciona una categoría")
            .addOptions(
                CATEGORIES.map(category => ({
                    label: category.label,
                    description: category.description,
                    value: category.id,
                    emoji: parseEmoji(category.emoji)
                }))
            );

        const row = new ActionRowBuilder()
            .addComponents(menu);

        await channel.send({
            content: panelContent,
            components: [row]
        });

        console.log("✅ Panel de tickets enviado correctamente.");

    } catch (error) {
        console.error("❌ Error enviando panel de tickets:", error);
    }
}


/* =========================================================
   OBTENER TICKET
========================================================= */

function getTicket(channelId) {
    return tickets.get(channelId);
}


/* =========================================================
   CREAR TICKET
========================================================= */

async function createTicket(interaction, categoryId, client) {
    try {
        const category = CATEGORIES.find(
            item => item.id === categoryId
        );

        if (!category) {
            if (interaction.deferred) {
                return interaction.editReply({
                    content: "❌ Categoría de ticket inválida."
                });
            }

            return interaction.reply({
                content: "❌ Categoría de ticket inválida.",
                ephemeral: true
            });
        }

        const guild = interaction.guild;

        if (!guild) {
            return interaction.editReply({
                content: "❌ Este sistema solo funciona dentro del servidor."
            });
        }

        // Evitar dos tickets normales del mismo usuario
        const existingTicket = [...tickets.values()].find(
            ticket =>
                ticket.userId === interaction.user.id &&
                ticket.type === "ticket"
        );

        if (existingTicket) {
            const existingChannel = await guild.channels.fetch(
                existingTicket.channelId
            ).catch(() => null);

            if (existingChannel) {
                return interaction.editReply({
                    content:
                        `⚠️ Ya tienes un ticket abierto: ${existingChannel}`
                });
            }

            tickets.delete(existingTicket.channelId);
        }

        const username = interaction.user.username
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "")
            .slice(0, 70) || "usuario";

        const channel = await guild.channels.create({
            name: `ticket・${username}`,
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
                        PermissionFlagsBits.EmbedLinks
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
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks
                    ]
                }
            ]
        });

        const ticket = {
            channelId: channel.id,
            userId: interaction.user.id,
            username: interaction.user.username,
            categoryId: category.id,
            categoryName: category.label,
            type: "ticket",
            createdAt: Date.now(),
            claimedBy: null,
            actions: []
        };

        tickets.set(channel.id, ticket);

        const embed = new EmbedBuilder()
            .setTitle(`${EMOJIS.loading} TICKET DE SOPORTE`)
            .setDescription(
                `Bienvenido al sistema de soporte de **DICA STUDIO**.\n\n` +
                `👤 **Usuario:** ${interaction.user}\n` +
                `🎫 **Categoría:** ${category.label}\n\n` +
                `Un miembro del Staff te atenderá lo antes posible.`
            )
            .addFields({
                name: `${EMOJIS.staff} Staff`,
                value: `<@&${CONFIG.STAFF_ROLE}>`,
                inline: false
            })
            .setTimestamp()
            .setFooter({
                text: "DICA Guard • DICA STUDIO"
            });

        await channel.send({
            content:
                `${EMOJIS.staff} <@&${CONFIG.STAFF_ROLE}> ${interaction.user}`,
            embeds: [embed],
            components: [getTicketButtons()],
            allowedMentions: {
                roles: [CONFIG.STAFF_ROLE],
                users: [interaction.user.id]
            }
        });

        console.log(
            `🎫 Ticket creado: ${channel.name} | ${interaction.user.username}`
        );

        /*
         * La interacción ya fue deferida desde index.js.
         * Por eso usamos editReply y NO reply.
         */

        if (interaction.deferred) {
            await interaction.editReply({
                content: `🎫 Ticket creado correctamente: ${channel}`
            });
        } else if (!interaction.replied) {
            await interaction.reply({
                content: `🎫 Ticket creado correctamente: ${channel}`,
                ephemeral: true
            });
        }

        return channel;

    } catch (error) {
        console.error("❌ Error creando ticket:", error);

        if (interaction.deferred) {
            await interaction.editReply({
                content: "❌ No se pudo crear el ticket."
            }).catch(() => {});
        } else if (!interaction.replied) {
            await interaction.reply({
                content: "❌ No se pudo crear el ticket.",
                ephemeral: true
            }).catch(() => {});
        }

        return null;
    }
}


/* =========================================================
   RECLAMAR
========================================================= */

async function claimTicket(channel, member, interaction) {
    const ticket = tickets.get(channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket.",
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
        if (ticket.claimedBy === member.id) {
            return interaction.reply({
                content: "⚠️ Ya tienes reclamado este ticket.",
                ephemeral: true
            });
        }

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
        timestamp: Date.now()
    });

    await channel.send({
        content: `🎯 **Ticket reclamado por ${member}.**`
    });

    return interaction.reply({
        content: "✅ Has reclamado este ticket.",
        ephemeral: true
    });
}


/* =========================================================
   LIBERAR
========================================================= */

async function releaseTicket(channel, member, interaction) {
    const ticket = tickets.get(channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket.",
            ephemeral: true
        });
    }

    if (!isStaff(member)) {
        return interaction.reply({
            content: "❌ No tienes permisos para liberar tickets.",
            ephemeral: true
        });
    }

    if (!ticket.claimedBy) {
        return interaction.reply({
            content: "⚠️ Este ticket no está reclamado.",
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
        timestamp: Date.now()
    });

    ticket.claimedBy = null;

    await channel.send({
        content: `🔓 **Ticket liberado por ${member}.**`
    });

    return interaction.reply({
        content: "✅ Ticket liberado correctamente.",
        ephemeral: true
    });
}


/* =========================================================
   AÑADIR USUARIO
========================================================= */

async function addUserToTicket(channel, member, user, interaction) {
    const ticket = tickets.get(channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket.",
            ephemeral: true
        });
    }

    if (!isStaff(member)) {
        return interaction.reply({
            content: "❌ Solo el Staff puede añadir usuarios.",
            ephemeral: true
        });
    }

    if (!user) {
        return interaction.reply({
            content: "❌ Debes especificar un usuario.",
            ephemeral: true
        });
    }

    try {
        await channel.permissionOverwrites.edit(user.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true
        });

        ticket.actions.push({
            type: "add_user",
            userId: member.id,
            targetId: user.id,
            timestamp: Date.now()
        });

        await channel.send({
            content:
                `👤 **${user} ha sido añadido al ticket por ${member}.**`
        });

        return interaction.reply({
            content: `✅ ${user} fue añadido correctamente.`,
            ephemeral: true
        });

    } catch (error) {
        console.error("❌ Error añadiendo usuario:", error);

        return interaction.reply({
            content: "❌ No se pudo añadir al usuario.",
            ephemeral: true
        });
    }
}


/* =========================================================
   CERRAR
========================================================= */

async function closeTicket(
    channel,
    member,
    interaction,
    transcriptCallback,
    client
) {
    const ticket = tickets.get(channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Este canal no es un ticket.",
            ephemeral: true
        });
    }

    if (!isStaff(member)) {
        return interaction.reply({
            content: "❌ No tienes permisos para cerrar este ticket.",
            ephemeral: true
        });
    }

    if (interaction.deferred || interaction.replied) {
        // Ya respondida: no hacemos nada aquí.
    } else {
        await interaction.deferReply({
            ephemeral: true
        }).catch(() => {});
    }

    ticket.actions.push({
        type: "close",
        userId: member.id,
        timestamp: Date.now()
    });

    ticket.closedAt = Date.now();

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

    // Enviar logs
    try {
        const logs = await client.channels.fetch(
            CONFIG.TICKET_LOGS
        );

        if (logs) {
            const logEmbed = new EmbedBuilder()
                .setTitle("🔒 TICKET CERRADO")
                .addFields(
                    {
                        name: "👤 Usuario",
                        value: `<@${ticket.userId}>`,
                        inline: true
                    },
                    {
                        name: "🎫 Categoría",
                        value: ticket.categoryName || "No especificada",
                        inline: true
                    },
                    {
                        name: "👮 Cerrado por",
                        value: `${member}`,
                        inline: true
                    }
                )
                .setTimestamp();

            const payload = {
                embeds: [logEmbed]
            };

            if (transcript) {
                payload.files = Array.isArray(transcript)
                    ? transcript
                    : [transcript];
            }

            await logs.send(payload);
        }
    } catch (error) {
        console.error(
            "❌ Error enviando log del ticket:",
            error
        );
    }

    // Avisar al usuario
    try {
        const user = await client.users.fetch(ticket.userId);

        await user.send(
            "🔒 **Tu ticket de DICA STUDIO ha sido cerrado.**\n\n" +
            "Si necesitas ayuda nuevamente, puedes abrir otro ticket."
        );
    } catch {
        console.log(
            "⚠️ No se pudo enviar MD al usuario del ticket."
        );
    }

    if (interaction.deferred) {
        await interaction.editReply({
            content: "🔒 Ticket cerrado correctamente."
        }).catch(() => {});
    } else if (!interaction.replied) {
        await interaction.reply({
            content: "🔒 Ticket cerrado correctamente.",
            ephemeral: true
        }).catch(() => {});
    }

    tickets.delete(channel.id);

    setTimeout(async () => {
        await channel.delete(
            "Ticket cerrado por Staff"
        ).catch(() => {});
    }, 1500);
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    CONFIG,
    EMOJIS,
    CATEGORIES,
    tickets,
    parseEmoji,
    isStaff,
    getTicket,
    getTicketButtons,
    sendTicketPanel,
    createTicket,
    claimTicket,
    releaseTicket,
    addUserToTicket,
    closeTicket
};
