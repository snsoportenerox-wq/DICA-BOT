require("dotenv").config();

const express = require("express");
const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    ActivityType,
    Collection,
    EmbedBuilder
} = require("discord.js");

// ==========================================
// CONFIGURACIÓN
// ==========================================

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN) {
    console.error("❌ Falta TOKEN en las variables de entorno.");
    process.exit(1);
}

if (!GUILD_ID) {
    console.error("❌ Falta GUILD_ID en las variables de entorno.");
    process.exit(1);
}

// ==========================================
// IDS DICA STUDIO
// ==========================================

const CONFIG = {
    GUILD_ID,

    TICKET_PANEL_CHANNEL: "1514355453742551102",
    TICKET_CATEGORY: "1514355351712043141",

    VERIFICATION_CHANNEL: "1540720296926122025",
    VERIFIED_ROLE: "1538146639703703562",

    STAFF_ROLE: "1540815218689441812",

    TICKET_LOGS: "1539791936058163241"
};

// ==========================================
// SISTEMAS
// ==========================================

const tickets = require("./systems/tickets");
const verification = require("./systems/verification");
const security = require("./systems/security");
const moderation = require("./systems/moderation");
const dmTickets = require("./systems/dmTickets");

const {
    generateTranscript
} = require("./utils/transcript");

const permissions = require("./utils/permissions");

const embeds = require("./utils/embeds");

// ==========================================
// CLIENT
// ==========================================

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

// ==========================================
// EXPRESS
// ==========================================

const app = express();

app.get("/", (req, res) => {
    res.status(200).send("DICA Guard está funcionando.");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "online",
        bot: client.user
            ? client.user.tag
            : "connecting"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Servidor web activo en el puerto ${PORT}`);
});

// ==========================================
// COLECCIÓN DE COMANDOS
// ==========================================

client.commands = new Collection();

// ==========================================
// COMANDOS SLASH
// ==========================================

const slashCommands = [
    {
        name: "help",
        description: "Muestra la ayuda de DICA Guard"
    }
];

// ==========================================
// REGISTRAR SLASH COMMANDS
// ==========================================

async function registerSlashCommands() {
    try {
        const rest = new REST({
            version: "10"
        }).setToken(TOKEN);

        console.log("🔄 Registrando comandos slash...");

        await rest.put(
            Routes.applicationGuildCommands(
                client.user.id,
                GUILD_ID
            ),
            {
                body: slashCommands
            }
        );

        console.log("✅ Comandos slash registrados.");
    } catch (error) {
        console.error(
            "❌ Error registrando comandos slash:",
            error
        );
    }
}

// ==========================================
// READY
// ==========================================

client.once("ready", async () => {
    console.log("==========================================");
    console.log("🛡️ DICA GUARD");
    console.log("==========================================");

    console.log(`🤖 Bot: ${client.user.tag}`);
    console.log(`🏠 Servidor ID: ${GUILD_ID}`);

    // Presencia
    client.user.setPresence({
        status: "dnd",

        activities: [
            {
                name: "DICA STUDIO",
                type: ActivityType.Watching
            }
        ]
    });

    console.log("🔴 Estado: DND");
    console.log("👀 Actividad: DICA STUDIO");

    // ======================================
    // SERVIDOR
    // ======================================

    const guild = client.guilds.cache.get(GUILD_ID);

    if (!guild) {
        console.error(
            "❌ DICA Guard no está dentro del servidor configurado."
        );

        return;
    }

    console.log(`✅ Servidor encontrado: ${guild.name}`);

    // ======================================
    // PANEL DE TICKETS
    // ======================================

    try {
        await tickets.sendTicketPanel(client);

        console.log("🎫 Panel de tickets comprobado.");
    } catch (error) {
        console.error(
            "❌ Error en panel de tickets:",
            error
        );
    }

    // ======================================
    // PANEL DE VERIFICACIÓN
    // ======================================

    try {
        await verification.sendVerificationPanel(client);

        console.log("🔐 Panel de verificación comprobado.");
    } catch (error) {
        console.error(
            "❌ Error en panel de verificación:",
            error
        );
    }

    // ======================================
    // SLASH
    // ======================================

    await registerSlashCommands();

    console.log("==========================================");
    console.log("🟢 DICA Guard está completamente online.");
    console.log("==========================================");
});

// ==========================================
// MENSAJES
// ==========================================

client.on("messageCreate", async (message) => {
    try {
        // Ignorar bots
        if (message.author.bot) {
            return;
        }

        // ======================================
        // MENSAJES POR MD
        // ======================================

        if (!message.guild) {
            await handleDirectMessage(message);
            return;
        }

        // ======================================
        // SEGURIDAD
        // ======================================

        await security.checkSpam(
            message,
            client
        ).catch(() => {});

        await security.checkMentions(
            message,
            client
        ).catch(() => {});

        // ======================================
        // TICKETS
        // ======================================

        await dmTickets.forwardUserMessage(
            message,
            client
        ).catch(() => {});

        // ======================================
        // PREFIJO
        // ======================================

        if (!message.content.startsWith("!")) {
            return;
        }

        const args = message.content
            .slice(1)
            .trim()
            .split(/\s+/);

        const command = args
            .shift()
            ?.toLowerCase();

        if (!command) {
            return;
        }

        // ======================================
        // HELP
        // ======================================

        if (command === "help") {
            await sendHelp(message);
            return;
        }

        // ======================================
        // PING
        // ======================================

        if (command === "ping") {
            const ping = client.ws.ping;

            await message.reply({
                embeds: [
                    embeds.infoEmbed(
                        "Pong",
                        `🏓 Latencia: **${ping}ms**`
                    )
                ]
            });

            return;
        }

        // ======================================
        // SERVER
        // ======================================

        if (command === "server") {
            await serverCommand(message);
            return;
        }

        // ======================================
        // USER
        // ======================================

        if (command === "user") {
            await userCommand(message, args);
            return;
        }

        // ======================================
        // AVATAR
        // ======================================

        if (command === "avatar") {
            await avatarCommand(message, args);
            return;
        }

        // ======================================
        // BANNER
        // ======================================

        if (command === "banner") {
            await bannerCommand(message, args);
            return;
        }

        // ======================================
        // BOTINFO
        // ======================================

        if (command === "botinfo") {
            await botInfoCommand(message);
            return;
        }

        // ======================================
        // UPTIME
        // ======================================

        if (command === "uptime") {
            await uptimeCommand(message);
            return;
        }

        // ======================================
        // SECURITY
        // ======================================

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
            await securityCommand(
                message,
                command
            );

            return;
        }

        // ======================================
        // TICKETS
        // ======================================

        if (command === "ticket") {
            await message.reply(
                "🎫 Utiliza el panel de tickets para abrir un ticket."
            );

            return;
        }

        if (command === "claim") {
            await tickets.claimTicket(
                message.channel,
                message.member,
                message
            ).catch(async () => {
                await message.reply(
                    "❌ No se pudo reclamar este ticket."
                );
            });

            return;
        }

        if (command === "release") {
            await tickets.releaseTicket(
                message.channel,
                message.member,
                message
            ).catch(async () => {
                await message.reply(
                    "❌ No se pudo liberar este ticket."
                );
            });

            return;
        }

        if (command === "close") {
            await tickets.closeTicket(
                message.channel,
                message.member,
                message,
                async (channel, ticket) => {
                    return generateTranscript(
                        channel,
                        ticket
                    );
                },
                client
            ).catch(async () => {
                await message.reply(
                    "❌ No se pudo cerrar este ticket."
                );
            });

            return;
        }

        if (command === "add") {
            await addTicketUser(
                message,
                args
            );

            return;
        }

        // ======================================
        // MODERACIÓN
        // ======================================

        if (command === "warn") {
            await moderation.warn(
                message,
                args
            );
            return;
        }

        if (command === "warnings") {
            await moderation.showWarnings(
                message,
                args
            );
            return;
        }

        if (command === "timeout") {
            await moderation.timeout(
                message,
                args
            );
            return;
        }

        if (command === "untimeout") {
            await moderation.untimeout(
                message,
                args
            );
            return;
        }

        if (command === "kick") {
            await moderation.kick(
                message,
                args
            );
            return;
        }

        if (command === "ban") {
            await moderation.ban(
                message,
                args
            );
            return;
        }

        if (command === "unban") {
            await moderation.unban(
                message,
                args
            );
            return;
        }

        if (command === "purge") {
            await moderation.purge(
                message,
                args
            );
            return;
        }

        if (command === "lock") {
            await moderation.lock(
                message,
                args
            );
            return;
        }

        if (command === "unlock") {
            await moderation.unlock(
                message,
                args
            );
            return;
        }

        // ======================================
        // CONFIG
        // ======================================

        if (command === "config") {
            if (!permissions.isStaffOrAdmin(message.member)) {
                await message.reply(
                    "❌ No tienes permiso para utilizar este comando."
                );

                return;
            }

            const embed = embeds.infoEmbed(
                "⚙️ CONFIGURACIÓN",
                [
                    `🏠 **Servidor:** ${message.guild.name}`,
                    `🎫 **Panel tickets:** <#${CONFIG.TICKET_PANEL_CHANNEL}>`,
                    `📂 **Categoría:** <#${CONFIG.TICKET_CATEGORY}>`,
                    `🔐 **Verificación:** <#${CONFIG.VERIFICATION_CHANNEL}>`,
                    `👮 **Staff:** <@&${CONFIG.STAFF_ROLE}>`,
                    `📋 **Logs:** <#${CONFIG.TICKET_LOGS}>`
                ].join("\n")
            );

            await message.reply({
                embeds: [embed]
            });

            return;
        }

        // ======================================
        // TICKET PANEL
        // ======================================

        if (command === "ticket-panel") {
            if (!permissions.isStaffOrAdmin(message.member)) {
                await message.reply(
                    "❌ No tienes permiso para utilizar este comando."
                );

                return;
            }

            await tickets.sendTicketPanel(client);

            await message.reply(
                "✅ Panel de tickets comprobado."
            );

            return;
        }

    } catch (error) {
        console.error(
            "❌ Error en messageCreate:",
            error
        );
    }
});

// ==========================================
// MENSAJES DIRECTOS
// ==========================================

async function handleDirectMessage(message) {
    try {
        console.log(
            `📩 MD recibido de ${message.author.tag}`
        );

        // Buscar si ya existe un ticket MD
        const existing =
            dmTickets.dmTickets.get(
                message.author.id
            );

        if (!existing) {
            await dmTickets.createDMTicket(
                message,
                client
            );

            return;
        }

        // Enviar mensaje al ticket existente
        await dmTickets.forwardUserMessage(
            message,
            client
        );

    } catch (error) {
        console.error(
            "❌ Error procesando MD:",
            error
        );
    }
}

// ==========================================
// INTERACCIONES
// ==========================================

client.on("interactionCreate", async (interaction) => {
    try {

        // ======================================
        // SLASH COMMANDS
        // ======================================

        if (interaction.isChatInputCommand()) {

            if (interaction.commandName === "help") {
                await interaction.reply({
                    embeds: [
                        createHelpEmbed()
                    ]
                });

                return;
            }
        }

        // ======================================
        // BOTONES
        // ======================================

        if (interaction.isButton()) {

            // ==================================
            // VERIFICACIÓN
            // ==================================

            if (
                interaction.customId ===
                "dica_verify_button"
            ) {
                await verification.startVerification(
                    interaction
                );

                return;
            }

            // ==================================
            // MOSTRAR ROLES
            // ==================================

            if (
                interaction.customId ===
                "dica_server_roles"
            ) {
                await showRoles(
                    interaction
                );

                return;
            }

            // ==================================
            // TICKET
            // ==================================

            if (
                interaction.customId ===
                "dica_ticket_add"
            ) {
                if (
                    !permissions.isStaff(
                        interaction.member
                    )
                ) {
                    await interaction.reply({
                        content:
                            "❌ Solo Staff puede utilizar esta función.",
                        ephemeral: true
                    });

                    return;
                }

                await interaction.reply({
                    content:
                        "👤 Utiliza `!add @usuario` para añadir un usuario al ticket.",
                    ephemeral: true
                });

                return;
            }

            if (
                interaction.customId ===
                "dica_ticket_claim"
            ) {
                await tickets.claimTicket(
                    interaction.channel,
                    interaction.member,
                    interaction
                );

                return;
            }

            if (
                interaction.customId ===
                "dica_ticket_release"
            ) {
                await tickets.releaseTicket(
                    interaction.channel,
                    interaction.member,
                    interaction
                );

                return;
            }

            if (
                interaction.customId ===
                "dica_ticket_close"
            ) {
                await tickets.closeTicket(
                    interaction.channel,
                    interaction.member,
                    interaction,
                    async (channel, ticket) => {
                        return generateTranscript(
                            channel,
                            ticket
                        );
                    },
                    client
                );

                return;
            }
        }

        // ======================================
        // SELECT MENUS
        // ======================================

        if (
            interaction.isStringSelectMenu()
        ) {

            if (
                interaction.customId ===
                "dica_ticket_category"
            ) {
                await tickets.createTicket(
                    interaction,
                    interaction.values[0],
                    client
                );

                return;
            }
        }

        // ======================================
        // MODAL VERIFICACIÓN
        // ======================================

        if (
            interaction.isModalSubmit()
        ) {

            if (
                interaction.customId ===
                "dica_verify_modal"
            ) {
                await verification.verifyCode(
                    interaction
                );

                return;
            }
        }

    } catch (error) {
        console.error(
            "❌ Error en interactionCreate:",
            error
        );

        try {
            if (
                interaction.isRepliable() &&
                !interaction.replied &&
                !interaction.deferred
            ) {
                await interaction.reply({
                    content:
                        "❌ Ocurrió un error al procesar esta acción.",
                    ephemeral: true
                });
            }
        } catch {}
    }
});

// ==========================================
// ADD USUARIO A TICKET
// ==========================================

async function addTicketUser(
    message,
    args
) {
    if (!message.channel.name?.startsWith("ticket-")) {
        await message.reply(
            "❌ Este comando solo puede utilizarse dentro de un ticket."
        );

        return;
    }

    if (!permissions.isStaff(message.member)) {
        await message.reply(
            "❌ Solo Staff puede añadir usuarios."
        );

        return;
    }

    const member =
        message.mentions.members.first();

    if (!member) {
        await message.reply(
            "❌ Debes mencionar al usuario que quieres añadir."
        );

        return;
    }

    await tickets.addUserToTicket(
        message.channel,
        member,
        message
    );
}

// ==========================================
// SERVER
// ==========================================

async function serverCommand(message) {
    const guild = message.guild;

    const embed =
        embeds.serverInfoEmbed(guild);

    const {
        ActionRowBuilder,
        ButtonBuilder,
        ButtonStyle
    } = require("discord.js");

    const button =
        new ButtonBuilder()
            .setCustomId(
                "dica_server_roles"
            )
            .setLabel("Roles")
            .setEmoji("🎭")
            .setStyle(ButtonStyle.Secondary);

    const row =
        new ActionRowBuilder()
            .addComponents(button);

    await message.reply({
        embeds: [embed],
        components: [row]
    });
}

// ==========================================
// ROLES
// ==========================================

async function showRoles(interaction) {
    const roles = interaction.guild.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .sort(
            (a, b) =>
                b.position - a.position
        );

    const roleList = roles
        .map(role => `🎭 ${role}`)
        .slice(0, 50);

    const total = roles.size;

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎭 ROLES DEL SERVIDOR")
        .setDescription(
            [
                `**${total} roles encontrados**`,
                "",
                roleList.join("\n") ||
                    "No hay roles disponibles.",
                "",
                "Página 1/1"
            ].join("\n")
        )
        .setFooter({
            text: "Solo tú puedes ver este panel."
        });

    await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}

// ==========================================
// USER
// ==========================================

async function userCommand(
    message,
    args
) {
    const member =
        message.mentions.members.first() ||
        message.member;

    const user =
        member.user;

    const embed =
        new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`👤 ${user.username}`)
            .setThumbnail(
                user.displayAvatarURL({
                    dynamic: true,
                    size: 256
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
                    value: `<t:${Math.floor(
                        user.createdTimestamp / 1000
                    )}:F>`,
                    inline: false
                },
                {
                    name: "📥 Entró al servidor",
                    value: member.joinedTimestamp
                        ? `<t:${Math.floor(
                            member.joinedTimestamp / 1000
                        )}:F>`
                        : "Desconocido",
                    inline: false
                }
            );

    await message.reply({
        embeds: [embed]
    });
}

// ==========================================
// AVATAR
// ==========================================

async function avatarCommand(
    message,
    args
) {
    const member =
        message.mentions.members.first() ||
        message.member;

    const avatar =
        member.user.displayAvatarURL({
            dynamic: true,
            size: 1024
        });

    const embed =
        new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(
                `🖼️ Avatar de ${member.user.username}`
            )
            .setImage(avatar);

    await message.reply({
        embeds: [embed]
    });
}

// ==========================================
// BANNER
// ==========================================

async function bannerCommand(
    message,
    args
) {
    const member =
        message.mentions.members.first() ||
        message.member;

    const user =
        await client.users.fetch(
            member.id,
            {
                force: true
            }
        );

    const banner =
        user.bannerURL({
            dynamic: true,
            size: 1024
        });

    if (!banner) {
        await message.reply(
            "❌ Este usuario no tiene banner."
        );

        return;
    }

    const embed =
        new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(
                `🖼️ Banner de ${user.username}`
            )
            .setImage(banner);

    await message.reply({
        embeds: [embed]
    });
}

// ==========================================
// BOT INFO
// ==========================================

async function botInfoCommand(message) {
    const embed =
        new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("🛡️ DICA GUARD")
            .setDescription(
                "Sistema privado de seguridad y soporte de DICA STUDIO."
            )
            .addFields(
                {
                    name: "🤖 Bot",
                    value: client.user.tag,
                    inline: true
                },
                {
                    name: "📚 Discord.js",
                    value: "v14",
                    inline: true
                },
                {
                    name: "🏠 Servidores",
                    value: `${client.guilds.cache.size}`,
                    inline: true
                },
                {
                    name: "👥 Usuarios",
                    value: `${client.users.cache.size}`,
                    inline: true
                },
                {
                    name: "🛡️ Sistema",
                    value: "DICA Guard",
                    inline: true
                },
                {
                    name: "🏢 Organización",
                    value: "DICA STUDIO",
                    inline: true
                }
            );

    await message.reply({
        embeds: [embed]
    });
}

// ==========================================
// UPTIME
// ==========================================

async function uptimeCommand(message) {
    const totalSeconds =
        Math.floor(
            process.uptime()
        );

    const days =
        Math.floor(
            totalSeconds / 86400
        );

    const hours =
        Math.floor(
            (totalSeconds % 86400) / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    await message.reply({
        embeds: [
            embeds.infoEmbed(
                "⏱️ Uptime",
                `🟢 DICA Guard lleva activo:\n\n**${days}d ${hours}h ${minutes}m ${seconds}s**`
            )
        ]
    });
}

// ==========================================
// SECURITY
// ==========================================

async function securityCommand(
    message,
    command
) {
    if (
        !permissions.isStaffOrAdmin(
            message.member
        )
    ) {
        await message.reply(
            "❌ No tienes permiso para utilizar este comando."
        );

        return;
    }

    const names = {
        security: "🛡️ Seguridad",
        automod: "🤖 AutoMod",
        antispam: "💬 Anti-Spam",
        antiraid: "🚨 Anti-Raid",
        antibot: "🤖 Anti-Bot",
        antimention: "📢 Anti-Mention",
        antichannel: "📁 Anti-Channel",
        antirole: "🎭 Anti-Role",
        antiban: "🔨 Anti-Ban",
        antikick: "👢 Anti-Kick",
        filter: "🚫 Filtro"
    };

    await message.reply({
        embeds: [
            embeds.securityEmbed(
                names[command] || "Seguridad",
                [
                    "🟢 Sistema activo",
                    "",
                    "DICA Guard está supervisando este servidor.",
                    "",
                    `⚙️ Módulo: **${command}**`
                ].join("\n")
            )
        ]
    });
}

// ==========================================
// HELP
// ==========================================

function createHelpEmbed() {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🛡️ DICA GUARD • AYUDA")
        .setDescription(
            "Sistema privado de administración, seguridad y soporte de **DICA STUDIO**."
        )
        .addFields(
            {
                name: "🎫 Tickets",
                value:
                    "`!ticket` `!claim` `!release` `!close` `!add @usuario`"
            },
            {
                name: "🔨 Moderación",
                value:
                    "`!warn` `!warnings` `!timeout` `!untimeout` `!kick` `!ban` `!unban` `!purge` `!lock` `!unlock`"
            },
            {
                name: "🛡️ Seguridad",
                value:
                    "`!security` `!automod` `!antispam` `!antiraid` `!antibot` `!antimention` `!antichannel` `!antirole` `!antiban` `!antikick` `!filter`"
            },
            {
                name: "ℹ️ Información",
                value:
                    "`!ping` `!server` `!user` `!avatar` `!banner` `!uptime` `!botinfo`"
            },
            {
                name: "⚙️ Administración",
                value:
                    "`!config` `!ticket-panel`"
            }
        )
        .setFooter({
            text: "DICA Guard • DICA STUDIO"
        })
        .setTimestamp();
}

async function sendHelp(message) {
    await message.reply({
        embeds: [
            createHelpEmbed()
        ]
    });
}

// ==========================================
// MANEJO DE ERRORES DEL CLIENTE
// ==========================================

client.on("error", error => {
    console.error(
        "❌ Discord Client Error:",
        error
    );
});

client.on(
    "warn",
    warning => {
        console.warn(
            "⚠️ Discord Warning:",
            warning
        );
    }
);

process.on(
    "unhandledRejection",
    error => {
        console.error(
            "❌ Unhandled Rejection:",
            error
        );
    }
);

process.on(
    "uncaughtException",
    error => {
        console.error(
            "❌ Uncaught Exception:",
            error
        );
    }
);

// ==========================================
// LOGIN
// ==========================================

console.log("🔄 Iniciando DICA Guard...");

client.login(TOKEN);
