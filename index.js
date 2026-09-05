require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionsBitField,
    ChannelType,
    AuditLogEvent,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");

const express = require("express");

/* =========================================================
   WEB SERVER
========================================================= */

const app = express();

app.get("/", (req, res) => {
    res.status(200).send("🛡️ DICA Guard está online.");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("🌐 Web server iniciado.");
});

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const CONFIG = {
    GUILD_ID: process.env.GUILD_ID,

    // Panel de tickets
    TICKET_PANEL_CHANNEL: "1514355453742551102",

    // Categoría donde se crean los tickets
    TICKET_CATEGORY: "1514355351712043141",

    // Verificación
    VERIFICATION_CHANNEL: "1540720296926122025",
    VERIFIED_ROLE: "1538146639703703562",

    // Staff
    STAFF_ROLE: "1540815218689441812",

    // Logs de tickets
    TICKET_LOGS: "1539791936058163241"
};

/* =========================================================
   EMOJIS
========================================================= */

const E = {
    loading: "<a:GTALoading:1526788751563558965>",

    warning: "<a:warning:1334727653969756170>",
    alliance: "<a:93619jumpingstar:1533480218411401296>",
    verified: "<:verified:710970919736311942>",
    crown: "<a:Crown_pink:1264023212673466379>",

    add: "<a:GTALoading:1526788751563558965>",
    claim: "<a:4731verifiedred:1533478086333567087>",
    release: "<a:emoji_235:1538333225066307654>",
    close: "<a:31white_x:1505680012177834235>",

    staff: "<:discord_staff:893226951085543455>"
};

/* =========================================================
   CLIENT
========================================================= */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],

    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User
    ]
});

/* =========================================================
   MEMORIA
========================================================= */

const tickets = new Map();
const verificationCodes = new Map();
const spamTracker = new Map();
const mentionTracker = new Map();

/*
    tickets:
    channelId => {
        guildId,
        userId,
        category,
        claimedBy,
        claimedAt,
        createdAt,
        source,
        messages: [],
        actions: []
    }
*/

/* =========================================================
   FUNCIONES GENERALES
========================================================= */

function isStaff(member) {
    if (!member) return false;

    return (
        member.permissions.has(
            PermissionsBitField.Flags.Administrator
        ) ||
        member.roles.cache.has(CONFIG.STAFF_ROLE)
    );
}

function isTicketChannel(channel) {
    return (
        channel &&
        channel.type === ChannelType.GuildText &&
        tickets.has(channel.id)
    );
}

function errorEmbed(text) {
    return new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle("❌ DICA Guard")
        .setDescription(text)
        .setTimestamp();
}

function successEmbed(title, text) {
    return new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(`✅ ${title}`)
        .setDescription(text)
        .setTimestamp();
}

function infoEmbed(title, text) {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(title)
        .setDescription(text)
        .setTimestamp();
}

function ticketOnly() {
    return {
        embeds: [
            errorEmbed(
                "Este comando solo puede utilizarse dentro de un ticket."
            )
        ]
    };
}

function staffOnly() {
    return {
        embeds: [
            errorEmbed(
                `${E.staff} Este comando solo puede utilizarlo el Staff.\n\n` +
                `Rol requerido: <@&${CONFIG.STAFF_ROLE}>`
            )
        ]
    };
}

function formatDate(date) {
    return new Date(date).toLocaleString("es-CO", {
        dateStyle: "medium",
        timeStyle: "medium"
    });
}

/* =========================================================
   PANEL DE TICKETS
========================================================= */

function getTicketPanel() {

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${E.loading} CENTRO DE SOPORTE`)
        .setDescription(
            `Bienvenido al sistema oficial de soporte de **DICA STUDIO**.\n\n` +

            `Selecciona una categoría para abrir un ticket.\n\n` +

            `${E.warning} **Reporte**\n` +
            `Reporta usuarios, Staff u otros problemas relacionados con el servidor.\n\n` +

            `${E.alliance} **Alianza**\n` +
            `Solicita alianzas o colaboraciones con DICA STUDIO.\n\n` +

            `${E.verified} **Soporte General**\n` +
            `Obtén ayuda con cualquier problema o consulta.\n\n` +

            `${E.crown} **Postulación**\n` +
            `Postúlate para formar parte del equipo de DICA STUDIO.`
        )
        .setTimestamp();

    const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_category")
        .setPlaceholder("Selecciona una categoría...")
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel("Reporte")
                .setDescription("Reporta usuarios, Staff o problemas.")
                .setValue("reporte")
                .setEmoji(E.warning),

            new StringSelectMenuOptionBuilder()
                .setLabel("Alianza")
                .setDescription("Solicita una alianza.")
                .setValue("alianza")
                .setEmoji(E.alliance),

            new StringSelectMenuOptionBuilder()
                .setLabel("Soporte General")
                .setDescription("Obtén ayuda con cualquier problema.")
                .setValue("soporte")
                .setEmoji(E.verified),

            new StringSelectMenuOptionBuilder()
                .setLabel("Postulación")
                .setDescription("Postúlate para formar parte del Staff.")
                .setValue("postulacion")
                .setEmoji(E.crown)
        );

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(menu)
        ]
    };
}

/* =========================================================
   ASEGURAR PANEL SIN DUPLICADOS
========================================================= */

async function ensureTicketPanel() {

    const channel = await client.channels
        .fetch(CONFIG.TICKET_PANEL_CHANNEL)
        .catch(() => null);

    if (!channel) {
        console.log("❌ No se encontró el canal del panel.");
        return;
    }

    const messages = await channel.messages
        .fetch({ limit: 50 })
        .catch(() => null);

    if (!messages) return;

    const exists = messages.some(message =>
        message.author.id === client.user.id &&
        message.embeds.some(embed =>
            embed.title &&
            embed.title.includes("CENTRO DE SOPORTE")
        )
    );

    if (!exists) {
        await channel.send(getTicketPanel());
        console.log("🎫 Panel de tickets enviado.");
    } else {
        console.log("🎫 Panel de tickets ya existe.");
    }
}

/* =========================================================
   PANEL DE VERIFICACIÓN
========================================================= */

function getVerificationPanel() {

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🔐 VERIFICACIÓN")
        .setDescription(
            `Bienvenido a **DICA STUDIO**.\n\n` +

            `La verificación permite confirmar tu cuenta y obtener acceso al servidor.\n\n` +

            `📋 **Sigue estos pasos**\n\n` +

            `1. Haz clic en el botón **Verificar**.\n` +
            `2. Revisa el MD que te enviará DICA Guard.\n` +
            `3. Introduce correctamente el código recibido.\n` +
            `4. Si el código es correcto, recibirás automáticamente tu rol de verificación.`
        )
        .setTimestamp();

    const button = new ButtonBuilder()
        .setCustomId("verification_start")
        .setLabel("Verificar")
        .setEmoji("🔐")
        .setStyle(ButtonStyle.Success);

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(button)
        ]
    };
}

/* =========================================================
   ASEGURAR PANEL DE VERIFICACIÓN
========================================================= */

async function ensureVerificationPanel() {

    const channel = await client.channels
        .fetch(CONFIG.VERIFICATION_CHANNEL)
        .catch(() => null);

    if (!channel) {
        console.log("❌ No se encontró el canal de verificación.");
        return;
    }

    const messages = await channel.messages
        .fetch({ limit: 50 })
        .catch(() => null);

    if (!messages) return;

    const exists = messages.some(message =>
        message.author.id === client.user.id &&
        message.embeds.some(embed =>
            embed.title &&
            embed.title.includes("VERIFICACIÓN")
        )
    );

    if (!exists) {
        await channel.send(getVerificationPanel());
        console.log("🔐 Panel de verificación enviado.");
    } else {
        console.log("🔐 Panel de verificación ya existe.");
    }
}

/* =========================================================
   CREAR TICKET
========================================================= */

async function createTicket(guild, user, category, source = "server") {

    const existing = [...tickets.values()].find(ticket =>
        ticket.guildId === guild.id &&
        ticket.userId === user.id
    );

    if (existing) {
        return existing.channelId;
    }

    const categoryNames = {
        reporte: "Reporte",
        alianza: "Alianza",
        soporte: "Soporte General",
        postulacion: "Postulación"
    };

    const cleanUsername = user.username
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúñ_-]/gi, "-")
        .slice(0, 70);

    const channelName =
        `${E.loading}・${cleanUsername}`;

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: CONFIG.TICKET_CATEGORY,

        topic:
            `DICA Guard | Ticket de ${user.tag} | ${categoryNames[category]}`,

        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [
                    PermissionsBitField.Flags.ViewChannel
                ]
            },

            {
                id: user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks
                ]
            },

            {
                id: CONFIG.STAFF_ROLE,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks
                ]
            },

            {
                id: client.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.ManageChannels,
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks
                ]
            }
        ]
    });

    const ticket = {
        channelId: channel.id,
        guildId: guild.id,
        userId: user.id,
        category,
        claimedBy: null,
        claimedAt: null,
        createdAt: Date.now(),
        source,
        messages: [],
        actions: []
    };

    tickets.set(channel.id, ticket);

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(
            `${E.loading} TICKET — ${categoryNames[category]}`
        )
        .setDescription(
            `Bienvenido <@${user.id}>.\n\n` +

            `${E.staff} **Staff disponible:** <@&${CONFIG.STAFF_ROLE}>\n\n` +

            `Un miembro del equipo atenderá tu ticket lo antes posible.\n\n` +

            `**Categoría:** ${categoryNames[category]}\n` +
            `**Usuario:** <@${user.id}>\n` +
            `**Origen:** ${source === "dm" ? "Mensaje Directo" : "Servidor"}`
        )
        .setFooter({
            text: "DICA Guard • DICA STUDIO"
        })
        .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(

        new ButtonBuilder()
            .setCustomId("ticket_add")
            .setLabel("Añadir usuario")
            .setEmoji(E.add)
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("ticket_claim")
            .setLabel("Reclamar")
            .setEmoji(E.claim)
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId("ticket_release")
            .setLabel("Liberar")
            .setEmoji(E.release)
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("Cerrar")
            .setEmoji(E.close)
            .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
        content:
            `<@${user.id}> <@&${CONFIG.STAFF_ROLE}>`,

        embeds: [embed],

        components: [buttons]
    });

    return channel.id;
}

/* =========================================================
   TRANSCRIPCIÓN
========================================================= */

async function generateTranscript(channel, ticket) {

    const messages = await channel.messages
        .fetch({ limit: 100 })
        .catch(() => new Map());

    const ordered = [...messages.values()]
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    let text = "";

    text += "========================================\n";
    text += "DICA GUARD - TRANSCRIPCIÓN DE TICKET\n";
    text += "========================================\n\n";

    text += `Usuario: ${ticket.userId}\n`;
    text += `Categoría: ${ticket.category}\n`;
    text += `Creado: ${formatDate(ticket.createdAt)}\n`;
    text += `Reclamado por: ${ticket.claimedBy || "Nadie"}\n`;
    text += `Origen: ${ticket.source}\n`;
    text += `Canal: ${channel.name}\n`;
    text += `ID del canal: ${channel.id}\n\n`;

    text += "--------------- MENSAJES ---------------\n\n";

    for (const message of ordered) {

        const timestamp = formatDate(
            message.createdTimestamp
        );

        text += `[${timestamp}] ${message.author.tag} (${message.author.id})\n`;

        text += `${message.content || "[Sin texto]"}\n`;

        if (message.attachments.size) {
            for (const attachment of message.attachments.values()) {
                text += `Adjunto: ${attachment.url}\n`;
            }
        }

        text += "\n";
    }

    text += "--------------- ACCIONES ---------------\n\n";

    for (const action of ticket.actions) {
        text += `[${formatDate(action.time)}] ${action.text}\n`;
    }

    return Buffer.from(text, "utf8");
}

/* =========================================================
   LOG DE TICKET
========================================================= */

async function sendTicketLog(ticket, title, description, file = null) {

    const channel = await client.channels
        .fetch(CONFIG.TICKET_LOGS)
        .catch(() => null);

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(title)
        .setDescription(description)
        .addFields(
            {
                name: "👤 Usuario",
                value: `<@${ticket.userId}>`,
                inline: true
            },
            {
                name: "🎫 Categoría",
                value: ticket.category,
                inline: true
            }
        )
        .setTimestamp();

    await channel.send({
        embeds: [embed],
        files: file ? [file] : []
    });
}

/* =========================================================
   CERRAR TICKET
========================================================= */

async function closeTicket(channel, closedBy) {

    const ticket = tickets.get(channel.id);

    if (!ticket) return;

    const transcript = await generateTranscript(
        channel,
        ticket
    );

    const file = {
        attachment: transcript,
        name: `transcript-${channel.id}.txt`
    };

    const logsChannel = await client.channels
        .fetch(CONFIG.TICKET_LOGS)
        .catch(() => null);

    const logEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle(`${E.close} TICKET CERRADO`)
        .setDescription(
            `Se ha cerrado un ticket de **DICA STUDIO**.`
        )
        .addFields(
            {
                name: "👤 Usuario",
                value: `<@${ticket.userId}>`,
                inline: true
            },
            {
                name: "👮 Cerrado por",
                value: `<@${closedBy.id}>`,
                inline: true
            },
            {
                name: "🎫 Categoría",
                value: ticket.category,
                inline: true
            },
            {
                name: "🆔 Canal",
                value: channel.id,
                inline: true
            }
        )
        .setTimestamp();

    if (logsChannel) {
        await logsChannel.send({
            embeds: [logEmbed],
            files: [file]
        });
    }

    const user = await client.users
        .fetch(ticket.userId)
        .catch(() => null);

    if (user) {

        const dmEmbed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle(`${E.close} TICKET CERRADO`)
            .setDescription(
                `Tu ticket de **DICA STUDIO** ha sido cerrado.\n\n` +
                `👮 **Cerrado por:** ${closedBy.tag}\n` +
                `🎫 **Categoría:** ${ticket.category}\n\n` +
                `Se adjunta la transcripción de tu ticket.`
            )
            .setTimestamp();

        await user.send({
            embeds: [dmEmbed],
            files: [file]
        }).catch(() => {});
    }

    ticket.actions.push({
        time: Date.now(),
        text: `Ticket cerrado por ${closedBy.tag}`
    });

    tickets.delete(channel.id);

    setTimeout(async () => {
        await channel.delete().catch(() => {});
    }, 3000);
}

/* =========================================================
   VERIFICACIÓN
========================================================= */

async function startVerification(interaction) {

    const member = interaction.member;

    if (
        member.roles.cache.has(
            CONFIG.VERIFIED_ROLE
        )
    ) {
        return interaction.reply({
            ephemeral: true,
            embeds: [
                successEmbed(
                    "Ya estás verificado",
                    "Tu cuenta ya posee el rol de verificación."
                )
            ]
        });
    }

    const code =
        Math.floor(100000 + Math.random() * 900000)
            .toString();

    verificationCodes.set(interaction.user.id, {
        code,
        expires: Date.now() + 5 * 60 * 1000,
        attempts: 0
    });

    const modal = new ModalBuilder()
        .setCustomId("verification_modal")
        .setTitle("🔐 Verificación");

    const input = new TextInputBuilder()
        .setCustomId("verification_code")
        .setLabel("Introduce el código recibido por MD")
        .setPlaceholder("Ejemplo: 482913")
        .setStyle(TextInputStyle.Short)
        .setMinLength(6)
        .setMaxLength(6)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(input)
    );

    await interaction.user.send({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("🔐 CÓDIGO DE VERIFICACIÓN")
                .setDescription(
                    `Tu código de verificación para **DICA STUDIO** es:\n\n` +
                    `# \`${code}\`\n\n` +
                    `⏱️ Este código expira en **5 minutos**.\n` +
                    `No compartas este código con otras personas.`
                )
                .setTimestamp()
        ]
    }).catch(async () => {
        verificationCodes.delete(interaction.user.id);

        return interaction.reply({
            ephemeral: true,
            embeds: [
                errorEmbed(
                    "No pude enviarte un MD. Activa los mensajes directos e inténtalo nuevamente."
                )
            ]
        });
    });

    await interaction.showModal(modal);
}

/* =========================================================
   EVENTO READY
========================================================= */

client.once("ready", async () => {

    console.log("================================");
    console.log("🛡️ DICA GUARD");
    console.log("================================");
    console.log(`🤖 Usuario: ${client.user.tag}`);
    console.log("🏢 DICA STUDIO");
    console.log("================================");

    client.user.setPresence({
        status: "dnd",

        activities: [
            {
                name: "DICA STUDIO",
                type: 3
            }
        ]
    });

    await ensureTicketPanel();
    await ensureVerificationPanel();

    console.log("🎫 Sistema de tickets cargado.");
    console.log("🔐 Sistema de verificación cargado.");
    console.log("🛡️ Sistema de seguridad cargado.");
});

/* =========================================================
   SELECTOR DE TICKETS
========================================================= */

client.on("interactionCreate", async interaction => {

    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId !== "ticket_category") {
        return;
    }

    const guild = interaction.guild;

    if (!guild) return;

    const category = interaction.values[0];

    const existing = [...tickets.values()].find(ticket =>
        ticket.guildId === guild.id &&
        ticket.userId === interaction.user.id
    );

    if (existing) {

        return interaction.reply({
            ephemeral: true,

            embeds: [
                errorEmbed(
                    `Ya tienes un ticket abierto: <#${existing.channelId}>`
                )
            ]
        });
    }

    await interaction.deferReply({
        ephemeral: true
    });

    const channelId = await createTicket(
        guild,
        interaction.user,
        category,
        "server"
    );

    await interaction.editReply({
        embeds: [
            successEmbed(
                "Ticket creado",
                `Tu ticket ha sido creado correctamente.\n\n` +
                `🎫 <#${channelId}>`
            )
        ]
    });
});

/* =========================================================
   BOTONES
========================================================= */

client.on("interactionCreate", async interaction => {

    if (!interaction.isButton()) return;

    /* -----------------------------------------
       VERIFICACIÓN
    ----------------------------------------- */

    if (
        interaction.customId ===
        "verification_start"
    ) {
        return startVerification(interaction);
    }

    /* -----------------------------------------
       TICKET
    ----------------------------------------- */

    if (!isTicketChannel(interaction.channel)) {

        return interaction.reply({
            ephemeral: true,
            embeds: [
                errorEmbed(
                    "Este botón solamente puede utilizarse dentro de un ticket."
                )
            ]
        });
    }

    const ticket = tickets.get(
        interaction.channel.id
    );

    /* -----------------------------------------
       AÑADIR
    ----------------------------------------- */

    if (interaction.customId === "ticket_add") {

        if (!isStaff(interaction.member)) {
            return interaction.reply({
                ephemeral: true,
                ...staffOnly()
            });
        }

        const modal = new ModalBuilder()
            .setCustomId("add_user_modal")
            .setTitle("Añadir usuario");

        const input = new TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("ID del usuario")
            .setPlaceholder("Ejemplo: 123456789012345678")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(input)
        );

        return interaction.showModal(modal);
    }

    /* -----------------------------------------
       RECLAMAR
    ----------------------------------------- */

    if (interaction.customId === "ticket_claim") {

        if (!isStaff(interaction.member)) {
            return interaction.reply({
                ephemeral: true,
                ...staffOnly()
            });
        }

        if (ticket.claimedBy) {

            return interaction.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        `Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`
                    )
                ]
            });
        }

        ticket.claimedBy = interaction.user.id;
        ticket.claimedAt = Date.now();

        ticket.actions.push({
            time: Date.now(),
            text: `Ticket reclamado por ${interaction.user.tag}`
        });

        await interaction.reply({
            embeds: [
                successEmbed(
                    "Ticket reclamado",
                    `${E.staff} <@${interaction.user.id}> ha reclamado este ticket.`
                )
            ]
        });

        return sendTicketLog(
            ticket,
            `${E.claim} TICKET RECLAMADO`,
            `<@${interaction.user.id}> reclamó el ticket.`
        );
    }

    /* -----------------------------------------
       LIBERAR
    ----------------------------------------- */

    if (interaction.customId === "ticket_release") {

        if (!isStaff(interaction.member)) {
            return interaction.reply({
                ephemeral: true,
                ...staffOnly()
            });
        }

        if (!ticket.claimedBy) {

            return interaction.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        "Este ticket no está reclamado."
                    )
                ]
            });
        }

        if (
            ticket.claimedBy !==
            interaction.user.id &&
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {

            return interaction.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        `Solo <@${ticket.claimedBy}> puede liberar este ticket.`
                    )
                ]
            });
        }

        const previous = ticket.claimedBy;

        ticket.claimedBy = null;
        ticket.claimedAt = null;

        ticket.actions.push({
            time: Date.now(),
            text: `Ticket liberado por ${interaction.user.tag}`
        });

        await interaction.reply({
            embeds: [
                infoEmbed(
                    `${E.release} TICKET LIBERADO`,
                    `El ticket ha sido liberado por <@${interaction.user.id}>.\n\n` +
                    `${E.staff} El ticket está nuevamente disponible para otro miembro del Staff.`
                )
            ]
        });

        return sendTicketLog(
            ticket,
            `${E.release} TICKET LIBERADO`,
            `Anterior responsable: <@${previous}>\n` +
            `Liberado por: <@${interaction.user.id}>`
        );
    }

    /* -----------------------------------------
       CERRAR
    ----------------------------------------- */

    if (interaction.customId === "ticket_close") {

        if (!isStaff(interaction.member)) {
            return interaction.reply({
                ephemeral: true,
                ...staffOnly()
            });
        }

        await interaction.reply({
            embeds: [
                infoEmbed(
                    `${E.close} Cerrando ticket`,
                    "Generando la transcripción y enviándola a los registros..."
                )
            ]
        });

        return closeTicket(
            interaction.channel,
            interaction.user
        );
    }
});

/* =========================================================
   MODALES
========================================================= */

client.on("interactionCreate", async interaction => {

    if (!interaction.isModalSubmit()) return;

    /* -----------------------------------------
       VERIFICACIÓN
    ----------------------------------------- */

    if (
        interaction.customId ===
        "verification_modal"
    ) {

        const data =
            verificationCodes.get(
                interaction.user.id
            );

        if (!data) {

            return interaction.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        "No tienes una verificación activa. Pulsa nuevamente el botón Verificar."
                    )
                ]
            });
        }

        if (Date.now() > data.expires) {

            verificationCodes.delete(
                interaction.user.id
            );

            return interaction.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        "Tu código ha expirado. Solicita uno nuevo."
                    )
                ]
            });
        }

        data.attempts++;

        const input =
            interaction.fields.getTextInputValue(
                "verification_code"
            );

        if (input !== data.code) {

            if (data.attempts >= 5) {

                verificationCodes.delete(
                    interaction.user.id
                );

                return interaction.reply({
                    ephemeral: true,
                    embeds: [
                        errorEmbed(
                            "Has superado el número máximo de intentos. Solicita un nuevo código."
                        )
                    ]
                });
            }

            return interaction.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        `Código incorrecto.\n\nIntento ${data.attempts}/5.`
                    )
                ]
            });
        }

        const guild = client.guilds.cache.get(
            CONFIG.GUILD_ID
        );

        if (!guild) {

            return interaction.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        "No pude encontrar el servidor configurado."
                    )
                ]
            });
        }

        const member = await guild.members
            .fetch(interaction.user.id)
            .catch(() => null);

        if (!member) {

            return interaction.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        "No pude encontrar tu cuenta dentro del servidor."
                    )
                ]
            });
        }

        const role = guild.roles.cache.get(
            CONFIG.VERIFIED_ROLE
        );

        if (!role) {

            return interaction.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        "El rol de verificación no está configurado correctamente."
                    )
                ]
            });
        }

        await member.roles.add(
            role,
            "Verificación DICA Guard"
        );

        verificationCodes.delete(
            interaction.user.id
        );

        return interaction.reply({
            ephemeral: true,
            embeds: [
                successEmbed(
                    "Verificación completada",
                    `Tu cuenta ha sido verificada correctamente.\n\n` +
                    `🎉 Has recibido el rol <@&${CONFIG.VERIFIED_ROLE}>.`
                )
            ]
        });
    }

    /* -----------------------------------------
       AÑADIR USUARIO
    ----------------------------------------- */

    if (
        interaction.customId ===
        "add_user_modal"
    ) {

        if (!isTicketChannel(interaction.channel)) {
            return interaction.reply({
                ephemeral: true,
                ...ticketOnly()
            });
        }

        if (!isStaff(interaction.member)) {
            return interaction.reply({
                ephemeral: true,
                ...staffOnly()
            });
        }

        const userId =
            interaction.fields.getTextInputValue(
                "user_id"
            ).trim();

        const user = await client.users
            .fetch(userId)
            .catch(() => null);

        if (!user) {

            return interaction.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        "No encontré ningún usuario con ese ID."
                    )
                ]
            });
        }

        await interaction.channel.permissionOverwrites
            .edit(user.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true,
                EmbedLinks: true
            })
            .catch(() => null);

        const ticket =
            tickets.get(interaction.channel.id);

        ticket.actions.push({
            time: Date.now(),
            text:
                `${user.tag} añadido por ${interaction.user.tag}`
        });

        await interaction.reply({
            embeds: [
                successEmbed(
                    "Usuario añadido",
                    `${user} ha sido añadido al ticket por <@${interaction.user.id}>.`
                )
            ]
        });

        return sendTicketLog(
            ticket,
            `${E.add} USUARIO AÑADIDO`,
            `Usuario añadido: ${user}\n` +
            `Añadido por: <@${interaction.user.id}>`
        );
    }
});

/* =========================================================
   MENSAJES
========================================================= */

client.on("messageCreate", async message => {

    if (message.author.bot) return;

    /* =====================================================
       MENSAJES EN TICKETS
    ===================================================== */

    if (
        message.guild &&
        isTicketChannel(message.channel)
    ) {

        const ticket =
            tickets.get(message.channel.id);

        if (ticket) {

            ticket.messages.push({
                author: message.author.id,
                content: message.content,
                time: Date.now()
            });
        }

        /*
            Si el ticket vino de MD, se puede utilizar
            esta zona para reenviar mensajes al usuario.
        */

        return;
    }

    /* =====================================================
       MENSAJES DIRECTOS
    ===================================================== */

    if (!message.guild) {

        const guild = client.guilds.cache.get(
            CONFIG.GUILD_ID
        );

        if (!guild) return;

        let ticket = [...tickets.values()].find(
            t =>
                t.guildId === guild.id &&
                t.userId === message.author.id &&
                t.source === "dm"
        );

        if (!ticket) {

            const channelId =
                await createTicket(
                    guild,
                    message.author,
                    "soporte",
                    "dm"
                );

            ticket = tickets.get(channelId);

            await message.author.send({
                embeds: [
                    successEmbed(
                        "Ticket creado",
                        `Tu mensaje ha creado un ticket privado en DICA STUDIO.\n\n` +
                        `🎫 El Staff podrá responderte desde el ticket.`
                    )
                ]
            }).catch(() => {});
        }

        const channel = await guild.channels
            .fetch(ticket.channelId)
            .catch(() => null);

        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("📩 MENSAJE RECIBIDO POR MD")
            .setDescription(
                message.content || "[Mensaje sin texto]"
            )
            .setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();

        await channel.send({
            embeds: [embed]
        });

        return;
    }

    /* =====================================================
       PREFIX
    ===================================================== */

    if (!message.content.startsWith("!")) return;

    const args = message.content
        .slice(1)
        .trim()
        .split(/\s+/);

    const command =
        args.shift()?.toLowerCase();

    if (!command) return;

    /* =====================================================
       HELP
    ===================================================== */

    if (command === "help") {
        return sendHelp(message);
    }

    /* =====================================================
       UTILIDAD
    ===================================================== */

    if (command === "ping") {

        return message.reply({
            embeds: [
                infoEmbed(
                    "🏓 PONG",
                    `Latencia: **${client.ws.ping}ms**`
                )
            ]
        });
    }

    if (command === "uptime") {

        const seconds =
            Math.floor(client.uptime / 1000);

        const days =
            Math.floor(seconds / 86400);

        const hours =
            Math.floor((seconds % 86400) / 3600);

        const minutes =
            Math.floor((seconds % 3600) / 60);

        const secs =
            seconds % 60;

        return message.reply({
            embeds: [
                infoEmbed(
                    "⏱️ UPTIME",
                    `**${days}d ${hours}h ${minutes}m ${secs}s**`
                )
            ]
        });
    }

    if (command === "botinfo") {

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle("🛡️ DICA GUARD")
                    .setDescription(
                        "Sistema privado de seguridad y soporte de **DICA STUDIO**."
                    )
                    .addFields(
                        {
                            name: "🤖 Bot",
                            value: client.user.tag,
                            inline: true
                        },
                        {
                            name: "📡 Ping",
                            value: `${client.ws.ping}ms`,
                            inline: true
                        },
                        {
                            name: "🎫 Tickets activos",
                            value: `${tickets.size}`,
                            inline: true
                        }
                    )
                    .setTimestamp()
            ]
        });
    }

    /* =====================================================
       SERVER
    ===================================================== */

    if (command === "server") {

        const guild = message.guild;

        if (!guild) return;

        const owner =
            await guild.fetchOwner().catch(() => null);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🏢 ${guild.name}`)
            .setThumbnail(
                guild.iconURL({
                    dynamic: true,
                    size: 1024
                })
            )
            .addFields(
                {
                    name: "👑 Propietario",
                    value: owner
                        ? `${owner.user}\n\`${owner.user.tag}\``
                        : "Desconocido",
                    inline: true
                },
                {
                    name: "👥 Miembros",
                    value: `${guild.memberCount}`,
                    inline: true
                },
                {
                    name: "🎭 Roles",
                    value: `${guild.roles.cache.size}`,
                    inline: true
                },
                {
                    name: "💬 Canales",
                    value: `${guild.channels.cache.size}`,
                    inline: true
                },
                {
                    name: "📅 Fecha de creación",
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                    inline: true
                },
                {
                    name: "🛡️ Seguridad",
                    value: "DICA Guard activa",
                    inline: true
                },
                {
                    name: "🚀 Boost",
                    value:
                        `Nivel ${guild.premiumTier}\n` +
                        `${guild.premiumSubscriptionCount || 0} boosts`,
                    inline: true
                }
            )
            .setFooter({
                text: "DICA Guard • Información del servidor"
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("server_roles")
                    .setLabel("Roles")
                    .setEmoji("🎭")
                    .setStyle(ButtonStyle.Secondary)
            );

        return message.reply({
            embeds: [embed],
            components: [row]
        });
    }

    /* =====================================================
       USER
    ===================================================== */

    if (command === "user") {

        const member =
            message.mentions.members.first() ||
            message.member;

        const user =
            member.user;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`👤 ${user.tag}`)
            .setThumbnail(
                user.displayAvatarURL({
                    dynamic: true,
                    size: 1024
                })
            )
            .addFields(
                {
                    name: "🆔 ID",
                    value: user.id,
                    inline: true
                },
                {
                    name: "📅 Cuenta creada",
                    value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`,
                    inline: true
                },
                {
                    name: "📥 Entró al servidor",
                    value: member.joinedTimestamp
                        ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
                        : "Desconocido",
                    inline: true
                },
                {
                    name: "🎭 Roles",
                    value:
                        member.roles.cache
                            .filter(r => r.id !== message.guild.id)
                            .map(r => r.toString())
                            .slice(0, 20)
                            .join(", ") || "Ninguno"
                }
            )
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }

    /* =====================================================
       AVATAR
    ===================================================== */

    if (command === "avatar") {

        const member =
            message.mentions.members.first() ||
            message.member;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🖼️ Avatar de ${member.user.tag}`)
            .setImage(
                member.user.displayAvatarURL({
                    dynamic: true,
                    size: 4096
                })
            )
            .setTimestamp();

        return message.reply({
            embeds: [embed]
        });
    }

    /* =====================================================
       BANNER
    ===================================================== */

    if (command === "banner") {

        const user =
            message.mentions.users.first() ||
            message.author;

        const fetched =
            await client.users.fetch(
                user.id,
                { force: true }
            );

        if (!fetched.banner) {

            return message.reply({
                embeds: [
                    errorEmbed(
                        "Este usuario no tiene un banner configurado."
                    )
                ]
            });
        }

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle(`🖼️ Banner de ${fetched.tag}`)
                    .setImage(
                        fetched.bannerURL({
                            size: 4096
                        })
                    )
                    .setTimestamp()
            ]
        });
    }

    /* =====================================================
       ROLE
    ===================================================== */

    if (command === "role") {

        const role =
            message.mentions.roles.first();

        if (!role) {

            return message.reply({
                embeds: [
                    errorEmbed(
                        "Debes mencionar un rol.\nEjemplo: `!role @Staff`"
                    )
                ]
            });
        }

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(role.color || 0x5865F2)
                    .setTitle(`🎭 ${role.name}`)
                    .addFields(
                        {
                            name: "🆔 ID",
                            value: role.id,
                            inline: true
                        },
                        {
                            name: "👥 Miembros",
                            value: `${role.members.size}`,
                            inline: true
                        },
                        {
                            name: "📅 Creado",
                            value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`,
                            inline: true
                        },
                        {
                            name: "🔝 Posición",
                            value: `${role.position}`,
                            inline: true
                        },
                        {
                            name: "🔒 Gestionable",
                            value: role.managed
                                ? "Sí"
                                : "No",
                            inline: true
                        }
                    )
                    .setTimestamp()
            ]
        });
    }

    /* =====================================================
       CHANNEL
    ===================================================== */

    if (command === "channel") {

        const channel =
            message.mentions.channels.first() ||
            message.channel;

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle(`💬 ${channel.name}`)
                    .addFields(
                        {
                            name: "🆔 ID",
                            value: channel.id,
                            inline: true
                        },
                        {
                            name: "📁 Tipo",
                            value: channel.type.toString(),
                            inline: true
                        },
                        {
                            name: "📅 Creado",
                            value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:F>`,
                            inline: true
                        }
                    )
                    .setTimestamp()
            ]
        });
    }

    /* =====================================================
       EMOJI
    ===================================================== */

    if (command === "emoji") {

        const emoji = message.guild.emojis.cache.find(
            e =>
                message.content.includes(
                    `<:${e.name}:${e.id}`
                ) ||
                message.content.includes(
                    `<a:${e.name}:${e.id}`
                )
        );

        if (!emoji) {

            return message.reply({
                embeds: [
                    errorEmbed(
                        "No encontré el emoji indicado."
                    )
                ]
            });
        }

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle(`😀 ${emoji.name}`)
                    .setThumbnail(emoji.url)
                    .addFields(
                        {
                            name: "🆔 ID",
                            value: emoji.id,
                            inline: true
                        },
                        {
                            name: "Animado",
                            value: emoji.animated
                                ? "Sí"
                                : "No",
                            inline: true
                        }
                    )
                    .setTimestamp()
            ]
        });
    }

    /* =====================================================
       TICKET COMMANDS
    ===================================================== */

    if (
        ["claim", "release", "add", "close"]
            .includes(command)
    ) {

        if (!isTicketChannel(message.channel)) {
            return message.reply(ticketOnly());
        }

        if (!isStaff(message.member)) {
            return message.reply(staffOnly());
        }

        const ticket =
            tickets.get(message.channel.id);

        if (command === "claim") {

            if (ticket.claimedBy) {

                return message.reply({
                    embeds: [
                        errorEmbed(
                            `Este ticket ya está reclamado por <@${ticket.claimedBy}>.`
                        )
                    ]
                });
            }

            ticket.claimedBy =
                message.author.id;

            ticket.claimedAt =
                Date.now();

            ticket.actions.push({
                time: Date.now(),
                text:
                    `Ticket reclamado por ${message.author.tag}`
            });

            await message.reply({
                embeds: [
                    successEmbed(
                        "Ticket reclamado",
                        `${E.staff} <@${message.author.id}> ahora está atendiendo este ticket.`
                    )
                ]
            });

            return sendTicketLog(
                ticket,
                `${E.claim} TICKET RECLAMADO`,
                `Reclamado por <@${message.author.id}>`
            );
        }

        if (command === "release") {

            if (!ticket.claimedBy) {

                return message.reply({
                    embeds: [
                        errorEmbed(
                            "Este ticket no está reclamado."
                        )
                    ]
                });
            }

            if (
                ticket.claimedBy !== message.author.id &&
                !message.member.permissions.has(
                    PermissionsBitField.Flags.Administrator
                )
            ) {

                return message.reply({
                    embeds: [
                        errorEmbed(
                            `Solo <@${ticket.claimedBy}> puede liberar este ticket.`
                        )
                    ]
                });
            }

            const previous =
                ticket.claimedBy;

            ticket.claimedBy = null;
            ticket.claimedAt = null;

            ticket.actions.push({
                time: Date.now(),
                text:
                    `Ticket liberado por ${message.author.tag}`
            });

            await message.reply({
                embeds: [
                    infoEmbed(
                        `${E.release} TICKET LIBERADO`,
                        `El ticket ha sido liberado por <@${message.author.id}>.\n\n` +
                        `${E.staff} Está disponible para otro miembro del Staff.`
                    )
                ]
            });

            return sendTicketLog(
                ticket,
                `${E.release} TICKET LIBERADO`,
                `Anterior responsable: <@${previous}>\n` +
                `Liberado por: <@${message.author.id}>`
            );
        }

        if (command === "add") {

            const member =
                message.mentions.members.first();

            if (!member) {

                return message.reply({
                    embeds: [
                        errorEmbed(
                            "Debes mencionar al usuario que quieres añadir.\n\n" +
                            "Ejemplo: `!add @Usuario`"
                        )
                    ]
                });
            }

            await message.channel.permissionOverwrites.edit(
                member.id,
                {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    AttachFiles: true,
                    EmbedLinks: true
                }
            );

            ticket.actions.push({
                time: Date.now(),
                text:
                    `${member.user.tag} añadido por ${message.author.tag}`
            });

            return message.reply({
                embeds: [
                    successEmbed(
                        "Usuario añadido",
                        `${member} ha sido añadido al ticket.`
                    )
                ]
            });
        }

        if (command === "close") {

            await message.reply({
                embeds: [
                    infoEmbed(
                        `${E.close} Cerrando ticket`,
                        "Generando transcripción..."
                    )
                ]
            });

            return closeTicket(
                message.channel,
                message.author
            );
        }
    }

    /* =====================================================
       SEGURIDAD
    ===================================================== */

    if (
        [
            "security",
            "automod",
            "antispam",
            "antiraid",
            "antibot",
            "antimention",
            "antichannel",
            "antirole",
            "antiban",
            "antikick",
            "filter"
        ].includes(command)
    ) {

        if (!isStaff(message.member)) {
            return message.reply(staffOnly());
        }

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle("🛡️ DICA GUARD — SEGURIDAD")
                    .setDescription(
                        "Los sistemas automáticos de seguridad están activos."
                    )
                    .addFields(
                        {
                            name: "💬 Anti-Spam",
                            value: "5 mensajes / 3 segundos → Timeout",
                            inline: true
                        },
                        {
                            name: "📢 Anti-Mention",
                            value: "5 menciones / 5 segundos → Timeout",
                            inline: true
                        },
                        {
                            name: "🤖 Anti-Bot",
                            value: "Protección automática",
                            inline: true
                        },
                        {
                            name: "📁 Anti-Channel",
                            value: "Protección automática",
                            inline: true
                        },
                        {
                            name: "🎭 Anti-Role",
                            value: "Protección automática",
                            inline: true
                        },
                        {
                            name: "🔨 Anti-Ban",
                            value: "Protección automática",
                            inline: true
                        },
                        {
                            name: "👢 Anti-Kick",
                            value: "Protección automática",
                            inline: true
                        },
                        {
                            name: "🚨 Anti-Raid",
                            value: "Protección automática",
                            inline: true
                        },
                        {
                            name: "🔤 Filtro",
                            value: "Protección automática",
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "DICA Guard • DICA STUDIO"
                    })
                    .setTimestamp()
            ]
        });
    }

    /* =====================================================
       MODERACIÓN
    ===================================================== */

    if (
        [
            "warn",
            "warnings",
            "timeout",
            "untimeout",
            "kick",
            "ban",
            "unban",
            "purge",
            "lock",
            "unlock"
        ].includes(command)
    ) {

        if (!isStaff(message.member)) {
            return message.reply(staffOnly());
        }

        const target =
            message.mentions.members.first();

        if (
            ["warn", "timeout", "untimeout", "kick", "ban"]
                .includes(command) &&
            !target
        ) {

            return message.reply({
                embeds: [
                    errorEmbed(
                        "Debes mencionar al usuario."
                    )
                ]
            });
        }

        if (command === "warn") {

            return message.reply({
                embeds: [
                    successEmbed(
                        "Advertencia",
                        `${target} ha recibido una advertencia.`
                    )
                ]
            });
        }

        if (command === "warnings") {

            return message.reply({
                embeds: [
                    infoEmbed(
                        "⚠️ ADVERTENCIAS",
                        `${target || message.author} no tiene advertencias registradas en esta sesión.`
                    )
                ]
            });
        }

        if (command === "timeout") {

            await target.timeout(
                10 * 60 * 1000,
                `Moderación por ${message.author.tag}`
            ).catch(() => null);

            return message.reply({
                embeds: [
                    successEmbed(
                        "Timeout",
                        `${target} recibió un timeout de 10 minutos.`
                    )
                ]
            });
        }

        if (command === "untimeout") {

            await target.timeout(
                null,
                `Timeout retirado por ${message.author.tag}`
            ).catch(() => null);

            return message.reply({
                embeds: [
                    successEmbed(
                        "Timeout retirado",
                        `Se retiró el timeout a ${target}.`
                    )
                ]
            });
        }

        if (command === "kick") {

            await target.kick(
                `Kick por ${message.author.tag}`
            ).catch(() => null);

            return message.reply({
                embeds: [
                    successEmbed(
                        "Usuario expulsado",
                        `${target.user.tag} fue expulsado.`
                    )
                ]
            });
        }

        if (command === "ban") {

            await target.ban({
                reason:
                    `Ban por ${message.author.tag}`
            }).catch(() => null);

            return message.reply({
                embeds: [
                    successEmbed(
                        "Usuario baneado",
                        `${target.user.tag} fue baneado.`
                    )
                ]
            });
        }

        if (command === "unban") {

            const id = args[0];

            if (!id) {

                return message.reply({
                    embeds: [
                        errorEmbed(
                            "Debes proporcionar el ID del usuario."
                        )
                    ]
                });
            }

            await message.guild.members
                .unban(
                    id,
                    `Unban por ${message.author.tag}`
                )
                .catch(() => null);

            return message.reply({
                embeds: [
                    successEmbed(
                        "Usuario desbaneado",
                        `Se procesó el unban de \`${id}\`.`
                    )
                ]
            });
        }

        if (command === "purge") {

            const amount =
                Math.min(
                    Math.max(
                        parseInt(args[0]) || 1,
                        1
                    ),
                    100
                );

            const deleted =
                await message.channel.bulkDelete(
                    amount,
                    true
                ).catch(() => null);

            if (!deleted) return;

            return message.channel.send({
                embeds: [
                    successEmbed(
                        "Mensajes eliminados",
                        `Se eliminaron **${deleted.size}** mensajes.`
                    )
                ]
            });
        }

        if (command === "lock") {

            await message.channel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                {
                    SendMessages: false
                }
            );

            return message.reply({
                embeds: [
                    successEmbed(
                        "Canal bloqueado",
                        "El canal ha sido bloqueado."
                    )
                ]
            });
        }

        if (command === "unlock") {

            await message.channel.permissionOverwrites.edit(
                message.guild.roles.everyone,
                {
                    SendMessages: null
                }
            );

            return message.reply({
                embeds: [
                    successEmbed(
                        "Canal desbloqueado",
                        "El canal ha sido desbloqueado."
                    )
                ]
            });
        }
    }

    /* =====================================================
       ADMINISTRACIÓN
    ===================================================== */

    if (
        command === "config" ||
        command === "ticket-panel"
    ) {

        if (!isStaff(message.member)) {
            return message.reply(staffOnly());
        }

        if (command === "ticket-panel") {

            return message.channel.send(
                getTicketPanel()
            );
        }

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle("⚙️ CONFIGURACIÓN DICA GUARD")
                    .setDescription(
                        "La configuración de DICA Guard está definida directamente en el código."
                    )
                    .addFields(
                        {
                            name: "🎫 Panel de tickets",
                            value: `<#${CONFIG.TICKET_PANEL_CHANNEL}>`,
                            inline: true
                        },
                        {
                            name: "📁 Categoría de tickets",
                            value: `<#${CONFIG.TICKET_CATEGORY}>`,
                            inline: true
                        },
                        {
                            name: "🔐 Verificación",
                            value: `<#${CONFIG.VERIFICATION_CHANNEL}>`,
                            inline: true
                        },
                        {
                            name: "👮 Staff",
                            value: `<@&${CONFIG.STAFF_ROLE}>`,
                            inline: true
                        },
                        {
                            name: "📋 Logs",
                            value: `<#${CONFIG.TICKET_LOGS}>`,
                            inline: true
                        }
                    )
                    .setTimestamp()
            ]
        });
    }
});

/* =========================================================
   BOTÓN DE ROLES DE !server
========================================================= */

client.on("interactionCreate", async interaction => {

    if (!interaction.isButton()) return;

    if (interaction.customId !== "server_roles") {
        return;
    }

    const guild = interaction.guild;

    if (!guild) return;

    const roles = guild.roles.cache
        .filter(role => role.id !== guild.id)
        .sort((a, b) => b.position - a.position);

    const list = [...roles.values()];

    const pageSize = 15;

    let page = 0;

    async function showRoles() {

        const start =
            page * pageSize;

        const current =
            list.slice(
                start,
                start + pageSize
            );

        const description =
            current.length
                ? current
                    .map(
                        role =>
                            `${role} — \`${role.id}\``
                    )
                    .join("\n")
                : "No hay roles.";

        const totalPages =
            Math.max(
                1,
                Math.ceil(list.length / pageSize)
            );

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("🎭 ROLES DEL SERVIDOR")
            .setDescription(
                `**${list.length} roles encontrados**\n\n` +
                description
            )
            .setFooter({
                text:
                    `Página ${page + 1}/${totalPages} • Solo tú puedes ver este mensaje`
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId("roles_prev")
                    .setLabel("Anterior")
                    .setEmoji("◀️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page <= 0),

                new ButtonBuilder()
                    .setCustomId("roles_next")
                    .setLabel("Siguiente")
                    .setEmoji("▶️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(
                        page >= totalPages - 1
                    )
            );

        return {
            embeds: [embed],
            components: [row]
        };
    }

    await interaction.reply({
        ephemeral: true,
        ...(await showRoles())
    });

    const reply =
        await interaction.fetchReply();

    const collector =
        reply.createMessageComponentCollector({
            time: 120000
        });

    collector.on("collect", async button => {

        if (
            button.user.id !==
            interaction.user.id
        ) {
            return button.reply({
                ephemeral: true,
                embeds: [
                    errorEmbed(
                        "Este panel pertenece a otro usuario."
                    )
                ]
            });
        }

        const totalPages =
            Math.max(
                1,
                Math.ceil(list.length / pageSize)
            );

        if (
            button.customId === "roles_prev" &&
            page > 0
        ) {
            page--;
        }

        if (
            button.customId === "roles_next" &&
            page < totalPages - 1
        ) {
            page++;
        }

        await button.update(
            await showRoles()
        );
    });

    collector.on("end", async () => {

        const disabledRow =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId("roles_prev_end")
                        .setLabel("Anterior")
                        .setEmoji("◀️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),

                    new ButtonBuilder()
                        .setCustomId("roles_next_end")
                        .setLabel("Siguiente")
                        .setEmoji("▶️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

        await interaction.editReply({
            components: [disabledRow]
        }).catch(() => {});
    });
});

/* =========================================================
   SEGURIDAD — ANTI SPAM
========================================================= */

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.guild) return;

    if (isStaff(message.member)) return;

    const key =
        `${message.guild.id}:${message.author.id}`;

    const now = Date.now();

    let data =
        spamTracker.get(key);

    if (!data) {

        data = {
            messages: [],
            warned: false
        };

        spamTracker.set(key, data);
    }

    data.messages =
        data.messages.filter(
            time => now - time < 3000
        );

    data.messages.push(now);

    if (data.messages.length >= 5) {

        data.messages = [];

        await message.member
            .timeout(
                10000,
                "DICA Guard Anti-Spam"
            )
            .catch(() => {});

        const logChannel =
            await client.channels
                .fetch(CONFIG.TICKET_LOGS)
                .catch(() => null);

        if (logChannel) {

            await logChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle("🛡️ ANTI-SPAM")
                        .setDescription(
                            `DICA Guard detectó spam y aplicó automáticamente un timeout.`
                        )
                        .addFields(
                            {
                                name: "👤 Usuario",
                                value: `${message.author}\n\`${message.author.id}\``
                            },
                            {
                                name: "⏱️ Límite",
                                value: "5 mensajes / 3 segundos"
                            },
                            {
                                name: "🔨 Acción",
                                value: "Timeout"
                            }
                        )
                        .setTimestamp()
                ]
            });
        }
    }
});

/* =========================================================
   SEGURIDAD — ANTI MENTION
========================================================= */

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.guild) return;
    if (isStaff(message.member)) return;

    const mentions =
        message.mentions.users.size +
        message.mentions.roles.size;

    if (mentions < 5) return;

    const key =
        `${message.guild.id}:mention:${message.author.id}`;

    const now = Date.now();

    let data =
        mentionTracker.get(key);

    if (!data) {
        data = [];
        mentionTracker.set(key, data);
    }

    data.push(now);

    data = data.filter(
        time => now - time < 5000
    );

    mentionTracker.set(key, data);

    if (data.length >= 5) {

        data.length = 0;

        await message.member
            .timeout(
                10000,
                "DICA Guard Anti-Mention"
            )
            .catch(() => {});
    }
});

/* =========================================================
   ANTI BOT
========================================================= */

client.on("guildMemberAdd", async member => {

    if (!member.user.bot) return;

    const recent =
        await member.guild.fetchAuditLogs({
            type: AuditLogEvent.BotAdd,
            limit: 5
        }).catch(() => null);

    const entry =
        recent?.entries.find(
            e =>
                e.target?.id === member.id
        );

    if (!entry) return;

    const logChannel =
        await client.channels
            .fetch(CONFIG.TICKET_LOGS)
            .catch(() => null);

    if (logChannel) {

        await logChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle("🤖 BOT AÑADIDO")
                    .setDescription(
                        `DICA Guard detectó la incorporación de un bot.`
                    )
                    .addFields(
                        {
                            name: "🤖 Bot",
                            value: `${member.user}\n\`${member.id}\``
                        },
                        {
                            name: "👤 Añadido por",
                            value:
                                entry.executor
                                    ? `${entry.executor}\n\`${entry.executor.id}\``
                                    : "Desconocido"
                        }
                    )
                    .setTimestamp()
            ]
        });
    }
});

/* =========================================================
   ANTI ROLE DELETE
========================================================= */

client.on("roleDelete", async role => {

    const logs =
        await role.guild.fetchAuditLogs({
            type: AuditLogEvent.RoleDelete,
            limit: 5
        }).catch(() => null);

    const entry =
        logs?.entries.find(
            e =>
                e.target?.id === role.id
        );

    if (!entry) return;

    const logChannel =
        await client.channels
            .fetch(CONFIG.TICKET_LOGS)
            .catch(() => null);

    if (!logChannel) return;

    await logChannel.send({
        embeds: [
            new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle("🎭 ROLE ELIMINADO")
                .setDescription(
                    "DICA Guard detectó la eliminación de un rol."
                )
                .addFields(
                    {
                        name: "🎭 Rol",
                        value:
                            `${role.name}\n\`${role.id}\``
                    },
                    {
                        name: "👤 Responsable",
                        value:
                            entry.executor
                                ? `${entry.executor}\n\`${entry.executor.id}\``
                                : "Desconocido"
                    }
                )
                .setTimestamp()
        ]
    });
});

/* =========================================================
   ANTI CHANNEL DELETE
========================================================= */

client.on("channelDelete", async channel => {

    if (!channel.guild) return;

    const logs =
        await channel.guild.fetchAuditLogs({
            type: AuditLogEvent.ChannelDelete,
            limit: 5
        }).catch(() => null);

    const entry =
        logs?.entries.find(
            e =>
                e.target?.id === channel.id
        );

    if (!entry) return;

    const logChannel =
        await client.channels
            .fetch(CONFIG.TICKET_LOGS)
            .catch(() => null);

    if (!logChannel) return;

    await logChannel.send({
        embeds: [
            new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle("📁 CANAL ELIMINADO")
                .setDescription(
                    "DICA Guard detectó la eliminación de un canal."
                )
                .addFields(
                    {
                        name: "📁 Canal",
                        value:
                            `${channel.name || "Desconocido"}\n\`${channel.id}\``
                    },
                    {
                        name: "👤 Responsable",
                        value:
                            entry.executor
                                ? `${entry.executor}\n\`${entry.executor.id}\``
                                : "Desconocido"
                    }
                )
                .setTimestamp()
        ]
    });
});

/* =========================================================
   HELP
========================================================= */

async function sendHelp(message) {

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🛡️ DICA GUARD — AYUDA")
        .setDescription(
            "Sistema de comandos de **DICA STUDIO**.\n\n" +
            "Todos los comandos utilizan `!`, excepto `/help`."
        )
        .addFields(

            {
                name: "🛠️ Utilidad",
                value:
                    "`!server` `!user` `!avatar` `!banner`\n" +
                    "`!role` `!channel` `!emoji` `!ping`\n" +
                    "`!uptime` `!botinfo`"
            },

            {
                name: "🎫 Tickets",
                value:
                    "`!claim` `!release` `!add` `!close`"
            },

            {
                name: "🛡️ Seguridad",
                value:
                    "`!security` `!automod` `!antispam`\n" +
                    "`!antiraid` `!antibot` `!antimention`\n" +
                    "`!antichannel` `!antirole` `!antiban`\n" +
                    "`!antikick` `!filter`"
            },

            {
                name: "👮 Moderación",
                value:
                    "`!warn` `!warnings` `!timeout` `!untimeout`\n" +
                    "`!kick` `!ban` `!unban` `!purge`\n" +
                    "`!lock` `!unlock`"
            },

            {
                name: "⚙️ Administración",
                value:
                    "`!config` `!ticket-panel`"
            },

            {
                name: "📖 Ayuda",
                value:
                    "`!help` `/help`"
            }
        )
        .setFooter({
            text: "DICA Guard • DICA STUDIO"
        })
        .setTimestamp();

    return message.reply({
        embeds: [embed]
    });
}

/* =========================================================
   /HELP — ÚNICO SLASH COMMAND
========================================================= */

const slashCommands = [

    new SlashCommandBuilder()
        .setName("help")
        .setDescription(
            "Muestra todos los comandos de DICA Guard."
        )
        .toJSON()

];

/* =========================================================
   REGISTRAR /HELP
========================================================= */

async function registerSlashCommands() {

    if (!TOKEN) {
        console.log("❌ Falta TOKEN.");
        return;
    }

    if (!CONFIG.GUILD_ID) {
        console.log("⚠️ Falta GUILD_ID.");
        return;
    }

    const rest = new REST({
        version: "10"
    }).setToken(TOKEN);

    try {

        await rest.put(
            Routes.applicationGuildCommands(
                client.user.id,
                CONFIG.GUILD_ID
            ),
            {
                body: slashCommands
            }
        );

        console.log("📖 /help registrado correctamente.");

    } catch (error) {

        console.error(
            "❌ Error registrando /help:",
            error
        );
    }
}

/* =========================================================
   INTERACTION /HELP
========================================================= */

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) {
        return;
    }

    if (interaction.commandName !== "help") {
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🛡️ DICA GUARD — AYUDA")
        .setDescription(
            "Comandos oficiales de DICA STUDIO.\n\n" +
            "La mayoría de comandos utilizan el prefijo `!`."
        )
        .addFields(

            {
                name: "🛠️ Utilidad",
                value:
                    "`!server` `!user` `!avatar` `!banner`\n" +
                    "`!role` `!channel` `!emoji` `!ping`\n" +
                    "`!uptime` `!botinfo`"
            },

            {
                name: "🎫 Tickets",
                value:
                    "`!claim` `!release` `!add` `!close`"
            },

            {
                name: "🛡️ Seguridad",
                value:
                    "`!security` `!automod` `!antispam` `!antiraid`\n" +
                    "`!antibot` `!antimention` `!antichannel`\n" +
                    "`!antirole` `!antiban` `!antikick` `!filter`"
            },

            {
                name: "👮 Moderación",
                value:
                    "`!warn` `!warnings` `!timeout` `!untimeout`\n" +
                    "`!kick` `!ban` `!unban` `!purge`\n" +
                    "`!lock` `!unlock`"
            },

            {
                name: "⚙️ Administración",
                value:
                    "`!config` `!ticket-panel`"
            },

            {
                name: "📖 Ayuda",
                value:
                    "`!help` y `/help`"
            }
        )
        .setFooter({
            text: "DICA Guard • DICA STUDIO"
        })
        .setTimestamp();

    await interaction.reply({
        embeds: [embed]
    });
});

/* =========================================================
   LOGIN
========================================================= */

if (!TOKEN) {

    console.error(
        "❌ ERROR: No existe TOKEN en las variables de entorno."
    );

} else {

    client.login(TOKEN)
        .catch(error => {
            console.error(
                "❌ Error iniciando sesión:",
                error
            );
        });
}
