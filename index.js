require("dotenv").config();

const express = require("express");
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

// ======================================================
// EXPRESS
// ======================================================

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).send("🟢 DICA STUDIO BOT ONLINE");
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: client.user?.tag || "connecting",
    uptime: process.uptime()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Express activo en puerto ${PORT}`);
});

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// ======================================================
// IDS
// ======================================================

const CONFIG = {
  PANEL_CHANNEL: "1514355453742551102",

  LOG_CHANNEL: "1539791936058163241",

  REQUEST_CHANNEL: "1540814503607009330",

  TICKET_CATEGORY: "1540814776878374943",

  STAFF_ROLE: "1540815218689441812",

  BOT_INVITE:
    "https://discord.com/oauth2/authorize?client_id=1530755091047387263"
};

// ======================================================
// CATEGORÍAS DE TICKETS
// ======================================================

const categories = {

  reporte: {
    name: "Reporte",
    emoji: "🚨",
    color: 0xED4245,

    options: [
      [
        "usuario",
        "👤",
        "Reportar usuario",
        "Reporta a un usuario"
      ],
      [
        "staff",
        "🛡️",
        "Reportar Staff",
        "Reporta a un miembro del Staff"
      ],
      [
        "estafa",
        "💸",
        "Reportar estafa",
        "Reporta una posible estafa"
      ],
      [
        "otro",
        "📋",
        "Otro reporte",
        "Otro tipo de reporte"
      ]
    ],

    questions: [
      [
        "reportado",
        "¿A quién estás reportando?",
        TextInputStyle.Short
      ],
      [
        "motivo",
        "¿Cuál es el motivo del reporte?",
        TextInputStyle.Paragraph
      ],
      [
        "pruebas",
        "¿Tienes pruebas?",
        TextInputStyle.Paragraph
      ],
      [
        "fecha",
        "¿Cuándo ocurrió?",
        TextInputStyle.Short
      ],
      [
        "extra",
        "Información adicional",
        TextInputStyle.Paragraph
      ]
    ]
  },

  alianza: {
    name: "Alianza",
    emoji: "🤝",
    color: 0x5865F2,

    options: [
      [
        "alianza",
        "🤝",
        "Solicitar alianza",
        "Solicita una alianza con DICA STUDIO"
      ],
      [
        "afiliacion",
        "🌐",
        "Afiliación",
        "Solicita una afiliación"
      ],
      [
        "colaboracion",
        "✨",
        "Colaboración",
        "Propón una colaboración"
      ],
      [
        "informacion",
        "📩",
        "Información",
        "Obtén información sobre alianzas"
      ]
    ],

    questions: [
      [
        "servidor",
        "Nombre del servidor",
        TextInputStyle.Short
      ],
      [
        "invitacion",
        "Invitación del servidor",
        TextInputStyle.Short
      ],
      [
        "miembros",
        "Cantidad de miembros",
        TextInputStyle.Short
      ],
      [
        "propuesta",
        "Describe tu propuesta",
        TextInputStyle.Paragraph
      ],
      [
        "extra",
        "Información adicional",
        TextInputStyle.Paragraph
      ]
    ]
  },

  soporte: {
    name: "Soporte General",
    emoji: "🛠️",
    color: 0x9B59B6,

    options: [
      [
        "ayuda",
        "❓",
        "Ayuda general",
        "Necesito ayuda"
      ],
      [
        "problema",
        "⚙️",
        "Problema",
        "Tengo un problema"
      ],
      [
        "bot",
        "🤖",
        "Problema con un bot",
        "Problemas relacionados con un bot"
      ],
      [
        "servicio",
        "💼",
        "Servicio",
        "Consulta sobre un servicio"
      ],
      [
        "otro",
        "📩",
        "Otra consulta",
        "Otra solicitud"
      ]
    ],

    questions: [
      [
        "asunto",
        "¿Cuál es tu problema?",
        TextInputStyle.Short
      ],
      [
        "descripcion",
        "Describe el problema",
        TextInputStyle.Paragraph
      ],
      [
        "pruebas",
        "¿Tienes pruebas?",
        TextInputStyle.Paragraph
      ],
      [
        "extra",
        "Información adicional",
        TextInputStyle.Paragraph
      ]
    ]
  },

  postulacion: {
    name: "Postulación",
    emoji: "📋",
    color: 0x57F287,

    options: [
      [
        "staff",
        "🛡️",
        "Postulación Staff",
        "Postúlate para formar parte del Staff"
      ],
      [
        "diseñador",
        "🎨",
        "Diseñador",
        "Postúlate como diseñador"
      ],
      [
        "desarrollador",
        "💻",
        "Desarrollador",
        "Postúlate como desarrollador"
      ],
      [
        "otro",
        "📋",
        "Otra postulación",
        "Otra posición"
      ]
    ],

    questions: [
      [
        "edad",
        "¿Cuál es tu edad?",
        TextInputStyle.Short
      ],
      [
        "experiencia",
        "¿Qué experiencia tienes?",
        TextInputStyle.Paragraph
      ],
      [
        "motivo",
        "¿Por qué quieres entrar?",
        TextInputStyle.Paragraph
      ],
      [
        "horario",
        "¿Cuánto tiempo tienes disponible?",
        TextInputStyle.Short
      ],
      [
        "extra",
        "Información adicional",
        TextInputStyle.Paragraph
      ]
    ]
  }
};

// ======================================================
// COMANDOS
// ======================================================

const commands = [

  // MODERACIÓN

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banea a un usuario")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Desbanea mediante ID")
    .addStringOption(option =>
      option
        .setName("id")
        .setDescription("ID del usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa a un usuario")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Aplica timeout")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minutos")
        .setDescription("Duración")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Quita timeout")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Advierte a un usuario")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Muestra advertencias")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Elimina mensajes")
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Configura el slowmode")
    .addIntegerOption(option =>
      option
        .setName("segundos")
        .setDescription("Segundos")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    ),

  // USUARIOS

  new SlashCommandBuilder()
    .setName("user-info")
    .setDescription("Información de usuario mediante ID")
    .addStringOption(option =>
      option
        .setName("id")
        .setDescription("ID del usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Muestra el avatar")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("roles")
    .setDescription("Muestra los roles")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("server-info")
    .setDescription("Información del servidor"),

  // BOT

  new SlashCommandBuilder()
    .setName("bot-info")
    .setDescription("Información del bot"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lista de comandos"),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Muestra la latencia"),

  new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Invitación del bot"),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Estadísticas del bot")

].map(command => command.toJSON());

// ======================================================
// REGISTRAR COMANDOS
// ======================================================

async function registerCommands() {

  const rest = new REST({
    version: "10"
  }).setToken(
    process.env.DISCORD_TOKEN
  );

  try {

    console.log("🔄 Registrando comandos...");

    await rest.put(
      Routes.applicationCommands(
        process.env.CLIENT_ID
      ),
      {
        body: commands
      }
    );

    console.log(
      `✅ ${commands.length} comandos registrados`
    );

  } catch (error) {

    console.error(
      "❌ Error registrando comandos:",
      error
    );

  }
}

// ======================================================
// LOGS
// ======================================================

async function sendLog(guild, embed) {

  const channel =
    guild.channels.cache.get(
      CONFIG.LOG_CHANNEL
    );

  if (!channel?.isTextBased()) return;

  await channel.send({
    embeds: [embed]
  }).catch(() => {});
}

// ======================================================
// STAFF
// ======================================================

function isStaff(interaction) {

  return interaction.member?.roles?.cache?.has(
    CONFIG.STAFF_ROLE
  );
}

// ======================================================
// PANEL EMBED
// ======================================================

function panelEmbed() {

  return new EmbedBuilder()

    .setColor(0x8E44AD)

    .setTitle(
      "🎫・𝐓𝐈𝐂𝐊𝐄𝐓𝐒 — 𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎"
    )

    .setDescription(`«✦・𝐁𝐈𝐄𝐍𝐕𝐄𝐍𝐈𝐃𝐎 𝐀𝐋 𝐒𝐈𝐒𝐓𝐄𝐌𝐀 𝐃𝐄 𝐒𝐎𝐏𝐎𝐑𝐓𝐄・✦»

╭─────────────── ✦ ───────────────╮
🎨・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎
✦・Diseño • Desarrollo • Creatividad・✦
╰─────────────── ✦ ───────────────╯

🎟️ **¿𝐍𝐄𝐂𝐄𝐒𝐈𝐓𝐀𝐒 𝐀𝐘𝐔𝐃𝐀?**

Nuestro sistema de tickets está diseñado para brindarte una atención rápida, organizada y personalizada.

Selecciona la opción que mejor describa tu solicitud y nuestro equipo te atenderá.

────────────────

🚨 **𝐑𝐄𝐏𝐎𝐑𝐓𝐄**

«Informa sobre usuarios, Staff, estafas u otras situaciones.»

🤝 **𝐀𝐋𝐈𝐀𝐍𝐙𝐀**

«Solicita una alianza, afiliación o colaboración.»

🛠️ **𝐒𝐎𝐏𝐎𝐑𝐓𝐄 𝐆𝐄𝐍𝐄𝐑𝐀𝐋**

«¿Tienes un problema o necesitas ayuda?»

📋 **𝐏𝐎𝐒𝐓𝐔𝐋𝐀𝐂𝐈Ó𝐍**

«Postúlate para formar parte de nuestro equipo.»

────────────────

📋 **𝐑𝐄𝐂𝐔𝐄𝐑𝐃𝐀**

✦ Explica tu solicitud claramente.
✦ Proporciona pruebas cuando sea necesario.
✦ No abras tickets duplicados.
✦ Mantén el respeto hacia el Staff.

✨ **𝐓𝐔 𝐒𝐀𝐓𝐈𝐒𝐅𝐀𝐂𝐂𝐈Ó𝐍 𝐄𝐒 𝐍𝐔𝐄𝐒𝐓𝐑𝐀 𝐏𝐑𝐈𝐎𝐑𝐈𝐃𝐀𝐃.**

🎨・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎
*Creamos. Diseñamos. Innovamos.*`)

    .setFooter({
      text:
        "DICA STUDIO • Sistema de Tickets"
    });
}

// ======================================================
// MENÚ PRINCIPAL
// ======================================================

function mainMenu() {

  return new ActionRowBuilder()
    .addComponents(

      new StringSelectMenuBuilder()

        .setCustomId(
          "ticket_category"
        )

        .setPlaceholder(
          "🎫・Selecciona una opción para abrir un ticket"
        )

        .addOptions(

          Object.entries(categories)
            .map(([id, category]) =>

              new StringSelectMenuOptionBuilder()

                .setLabel(
                  category.name
                )

                .setDescription(
                  `Abrir un ticket de ${category.name}`
                )

                .setEmoji(
                  category.emoji
                )

                .setValue(id)

            )

        )

    );
}

// ======================================================
// BOTÓN INVITAR BOT
// ======================================================

function inviteButton() {

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setLabel(
          "🤖・Invita uno de nuestros bots"
        )
        .setStyle(
          ButtonStyle.Link
        )
        .setURL(
          CONFIG.BOT_INVITE
        )

    );
}

// ======================================================
// MENÚ INTERNO
// ======================================================

function categoryMenu(category) {

  const data =
    categories[category];

  return new ActionRowBuilder()
    .addComponents(

      new StringSelectMenuBuilder()

        .setCustomId(
          `ticket_type:${category}`
        )

        .setPlaceholder(
          `${data.emoji}・Selecciona una opción`
        )

        .addOptions(

          data.options.map(
            ([value, emoji, label, description]) =>

              new StringSelectMenuOptionBuilder()
                .setValue(value)
                .setLabel(label)
                .setDescription(description)
                .setEmoji(emoji)

          )

        )

    );
}

// ======================================================
// BOTONES TICKET
// ======================================================

function ticketButtons() {

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId(
          "ticket_add"
        )
        .setLabel("Añadir")
        .setEmoji("➕")
        .setStyle(
          ButtonStyle.Secondary
        ),

      new ButtonBuilder()
        .setCustomId(
          "ticket_close"
        )
        .setLabel("Cerrar")
        .setEmoji("🔒")
        .setStyle(
          ButtonStyle.Danger
        )

    );
}

// ======================================================
// READY
// ======================================================

client.once(
  "ready",
  async () => {

    console.log(
      `🟢 Conectado como ${client.user.tag}`
    );

    await registerCommands();

    const channel =
      client.channels.cache.get(
        CONFIG.PANEL_CHANNEL
      );

    if (channel?.isTextBased()) {

      const messages =
        await channel.messages.fetch({
          limit: 20
        }).catch(() => null);

      const alreadyExists =
        messages?.some(
          message =>
            message.author.id ===
              client.user.id &&
            message.embeds[0]?.title ===
              "🎫・𝐓𝐈𝐂𝐊𝐄𝐓𝐒 — 𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎"
        );

      if (!alreadyExists) {

        await channel.send({

          embeds: [
            panelEmbed()
          ],

          components: [
            mainMenu(),
            inviteButton()
          ]

        });

        console.log(
          "🎫 Panel enviado automáticamente"
        );
      }

    }

  }
);

// ======================================================
// INTERACCIONES
// ======================================================

client.on(
  "interactionCreate",
  async interaction => {

    try {

      // ==================================================
      // COMANDOS
      // ==================================================

      if (
        interaction.isChatInputCommand()
      ) {

        // ----------------------------------------------
        // BAN
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "ban"
        ) {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.BanMembers
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso.",
              ephemeral: true
            });

          }

          const user =
            interaction.options.getUser(
              "usuario"
            );

          const reason =
            interaction.options.getString(
              "razon"
            ) ||
            "Sin razón especificada.";

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member) {

            return interaction.reply({
              content:
                "❌ El usuario no está en el servidor.",
              ephemeral: true
            });

          }

          if (!member.bannable) {

            return interaction.reply({
              content:
                "❌ No puedo banear a este usuario.",
              ephemeral: true
            });

          }

          await member.ban({
            reason
          });

          await interaction.reply({
            content:
              `🔨 **${user.tag}** fue baneado.\n📝 ${reason}`
          });

          return;
        }

        // ----------------------------------------------
        // UNBAN
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "unban"
        ) {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.BanMembers
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso.",
              ephemeral: true
            });

          }

          const id =
            interaction.options.getString(
              "id"
            );

          try {

            await interaction.guild.bans.remove(
              id
            );

            await interaction.reply({
              content:
                `✅ Usuario \`${id}\` desbaneado.`
            });

          } catch {

            await interaction.reply({
              content:
                "❌ No encontré ese usuario en la lista de baneados.",
              ephemeral: true
            });

          }

          return;
        }

        // ----------------------------------------------
        // KICK
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "kick"
        ) {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.KickMembers
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso.",
              ephemeral: true
            });

          }

          const user =
            interaction.options.getUser(
              "usuario"
            );

          const reason =
            interaction.options.getString(
              "razon"
            ) ||
            "Sin razón especificada.";

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member?.kickable) {

            return interaction.reply({
              content:
                "❌ No puedo expulsar a este usuario.",
              ephemeral: true
            });

          }

          await member.kick(
            reason
          );

          return interaction.reply({
            content:
              `👢 **${user.tag}** fue expulsado.`
          });
        }

        // ----------------------------------------------
        // TIMEOUT
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "timeout"
        ) {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.ModerateMembers
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso.",
              ephemeral: true
            });

          }

          const user =
            interaction.options.getUser(
              "usuario"
            );

          const minutes =
            interaction.options.getInteger(
              "minutos"
            );

          const reason =
            interaction.options.getString(
              "razon"
            ) ||
            "Sin razón especificada.";

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member?.moderatable) {

            return interaction.reply({
              content:
                "❌ No puedo aplicar timeout.",
              ephemeral: true
            });

          }

          await member.timeout(
            minutes * 60 * 1000,
            reason
          );

          return interaction.reply({
            content:
              `⏱️ **${user.tag}** recibió timeout por **${minutes} minutos**.`
          });
        }

        // ----------------------------------------------
        // UNTIMEOUT
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "untimeout"
        ) {

          const user =
            interaction.options.getUser(
              "usuario"
            );

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member?.moderatable) {

            return interaction.reply({
              content:
                "❌ No puedo modificar a este usuario.",
              ephemeral: true
            });

          }

          await member.timeout(
            null
          );

          return interaction.reply({
            content:
              `✅ Timeout retirado a **${user.tag}**.`
          });
        }

        // ----------------------------------------------
        // WARN
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "warn"
        ) {

          const user =
            interaction.options.getUser(
              "usuario"
            );

          const reason =
            interaction.options.getString(
              "razon"
            );

          return interaction.reply({
            content:
              `⚠️ **${user.tag}** recibió una advertencia.\n📝 ${reason}`
          });
        }

        // ----------------------------------------------
        // WARNINGS
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "warnings"
        ) {

          const user =
            interaction.options.getUser(
              "usuario"
            );

          return interaction.reply({

            embeds: [

              new EmbedBuilder()
                .setColor(
                  0xFEE75C
                )
                .setTitle(
                  "⚠️・ADVERTENCIAS"
                )
                .setDescription(
                  `👤 Usuario: ${user}\n\n` +
                  `📋 No hay un sistema persistente de advertencias configurado todavía.`
                )

            ]

          });
        }

        // ----------------------------------------------
        // CLEAR
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "clear"
        ) {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.ManageMessages
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso.",
              ephemeral: true
            });

          }

          const amount =
            interaction.options.getInteger(
              "cantidad"
            );

          await interaction.channel.bulkDelete(
            amount,
            true
          );

          return interaction.reply({
            content:
              `🧹 Eliminados **${amount} mensajes**.`,
            ephemeral: true
          });
        }

        // ----------------------------------------------
        // SLOWMODE
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "slowmode"
        ) {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.ManageChannels
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso.",
              ephemeral: true
            });

          }

          const seconds =
            interaction.options.getInteger(
              "segundos"
            );

          await interaction.channel.setRateLimitPerUser(
            seconds
          );

          return interaction.reply({
            content:
              `🐌 Slowmode: **${seconds}s**`
          });
        }

        // ----------------------------------------------
        // USER INFO
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "user-info"
        ) {

          const id =
            interaction.options.getString(
              "id"
            );

          const user =
            await client.users
              .fetch(id)
              .catch(() => null);

          if (!user) {

            return interaction.reply({
              content:
                "❌ ID no válida o usuario no encontrado.",
              ephemeral: true
            });

          }

          const member =
            await interaction.guild.members
              .fetch(id)
              .catch(() => null);

          const embed =
            new EmbedBuilder()

              .setColor(
                0x5865F2
              )

              .setTitle(
                "👤・𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂𝐈Ó𝐍 𝐃𝐄 𝐔𝐒𝐔𝐀𝐑𝐈𝐎"
              )

              .setThumbnail(
                user.displayAvatarURL({
                  size: 1024
                })
              )

              .addFields(

                {
                  name: "👤 Usuario",
                  value:
                    `${user}`,
                  inline: true
                },

                {
                  name: "🆔 ID",
                  value:
                    `\`${user.id}\``,
                  inline: true
                },

                {
                  name: "🤖 Bot",
                  value:
                    user.bot
                      ? "Sí"
                      : "No",
                  inline: true
                },

                {
                  name: "📅 Cuenta",
                  value:
                    `<t:${Math.floor(
                      user.createdTimestamp /
                      1000
                    )}:F>`
                },

                {
                  name: "📥 Entrada",
                  value:
                    member?.joinedTimestamp
                      ? `<t:${Math.floor(
                          member.joinedTimestamp /
                          1000
                        )}:F>`
                      : "No está en el servidor"
                }

              );

          return interaction.reply({
            embeds: [embed]
          });
        }

        // ----------------------------------------------
        // AVATAR
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "avatar"
        ) {

          const user =
            interaction.options.getUser(
              "usuario"
            ) ||
            interaction.user;

          return interaction.reply({

            embeds: [

              new EmbedBuilder()
                .setColor(
                  0x8E44AD
                )
                .setTitle(
                  `🖼️・AVATAR DE ${user.username}`
                )
                .setImage(
                  user.displayAvatarURL({
                    size: 4096
                  })
                )

            ]

          });
        }

        // ----------------------------------------------
        // ROLES
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "roles"
        ) {

          const user =
            interaction.options.getUser(
              "usuario"
            ) ||
            interaction.user;

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member) {

            return interaction.reply({
              content:
                "❌ Usuario no encontrado.",
              ephemeral: true
            });

          }

          const roles =
            member.roles.cache
              .filter(
                role =>
                  role.id !==
                  interaction.guild.id
              )
              .sort(
                (a, b) =>
                  b.position -
                  a.position
              )
              .map(
                role =>
                  role.toString()
              )
              .join(" ");

          return interaction.reply({

            embeds: [

              new EmbedBuilder()
                .setColor(
                  0x5865F2
                )
                .setTitle(
                  `🎭・ROLES DE ${user.username}`
                )
                .setDescription(
                  roles ||
                  "Sin roles."
                )

            ]

          });
        }

        // ----------------------------------------------
        // SERVER INFO
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "server-info"
        ) {

          const guild =
            interaction.guild;

          return interaction.reply({

            embeds: [

              new EmbedBuilder()

                .setColor(
                  0x5865F2
                )

                .setTitle(
                  `🏠・${guild.name}`
                )

                .setThumbnail(
                  guild.iconURL({
                    size: 1024
                  })
                )

                .addFields(

                  {
                    name: "🆔 ID",
                    value:
                      `\`${guild.id}\``,
                    inline: true
                  },

                  {
                    name: "👥 Miembros",
                    value:
                      `${guild.memberCount}`,
                    inline: true
                  },

                  {
                    name: "🎭 Roles",
                    value:
                      `${guild.roles.cache.size}`,
                    inline: true
                  },

                  {
                    name: "💬 Canales",
                    value:
                      `${guild.channels.cache.size}`,
                    inline: true
                  }

                )

            ]

          });
        }

        // ----------------------------------------------
        // BOT INFO
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "bot-info"
        ) {

          return interaction.reply({

            embeds: [

              new EmbedBuilder()

                .setColor(
                  0x8E44AD
                )

                .setTitle(
                  "🤖・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎 𝐁𝐎𝐓"
                )

                .setDescription(
                  "Sistema oficial de DICA STUDIO."
                )

                .addFields(

                  {
                    name: "🌐 Servidores",
                    value:
                      `${client.guilds.cache.size}`,
                    inline: true
                  },

                  {
                    name: "📡 Estado",
                    value:
                      "🟢 Online",
                    inline: true
                  },

                  {
                    name: "📶 Ping",
                    value:
                      `${client.ws.ping}ms`,
                    inline: true
                  }

                )

            ]

          });
        }

        // ----------------------------------------------
        // HELP
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "help"
        ) {

          return interaction.reply({

            embeds: [

              new EmbedBuilder()

                .setColor(
                  0x8E44AD
                )

                .setTitle(
                  "📚・𝐀𝐘𝐔𝐃𝐀 — 𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎"
                )

                .setDescription(`### 🛡️ Moderación

\`/ban\`
\`/unban\`
\`/kick\`
\`/timeout\`
\`/untimeout\`
\`/warn\`
\`/warnings\`
\`/clear\`
\`/slowmode\`

### 👤 Usuarios

\`/user-info\`
\`/avatar\`
\`/roles\`
\`/server-info\`

### 🤖 Bot

\`/bot-info\`
\`/help\`
\`/ping\`
\`/invite\`
\`/stats\`

🎫 Los tickets funcionan automáticamente mediante el panel.`)

            ]

          });
        }

        // ----------------------------------------------
        // PING
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "ping"
        ) {

          return interaction.reply({
            content:
              `🏓 Pong!\n📡 ${client.ws.ping}ms`
          });
        }

        // ----------------------------------------------
        // INVITE
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "invite"
        ) {

          return interaction.reply({
            content:
              `🤖 **Invita a DICA STUDIO:**\n${CONFIG.BOT_INVITE}`
          });
        }

        // ----------------------------------------------
        // STATS
        // ----------------------------------------------

        if (
          interaction.commandName ===
          "stats"
        ) {

          const members =
            client.guilds.cache.reduce(
              (total, guild) =>
                total +
                (guild.memberCount || 0),
              0
            );

          return interaction.reply({

            embeds: [

              new EmbedBuilder()

                .setColor(
                  0x8E44AD
                )

                .setTitle(
                  "📊・𝐄𝐒𝐓𝐀𝐃Í𝐒𝐓𝐈𝐂𝐀𝐒"
                )

                .addFields(

                  {
                    name: "🌐 Servidores",
                    value:
                      `${client.guilds.cache.size}`,
                    inline: true
                  },

                  {
                    name: "👥 Usuarios",
                    value:
                      `${members}`,
                    inline: true
                  },

                  {
                    name: "📡 Ping",
                    value:
                      `${client.ws.ping}ms`,
                    inline: true
                  }

                )

            ]

          });
        }
      }

      // ==================================================
      // MENÚ PRINCIPAL
      // ==================================================

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          "ticket_category"
      ) {

        const category =
          interaction.values[0];

        const data =
          categories[category];

        const existing =
          interaction.guild.channels.cache.find(
            channel =>
              channel.topic ===
              `ticket:${interaction.user.id}`
          );

        if (existing) {

          return interaction.reply({
            content:
              `❌ Ya tienes un ticket abierto: ${existing}`,
            ephemeral: true
          });

        }

        const username =
          interaction.user.username
            .toLowerCase()
            .replace(
              /[^a-z0-9]/g,
              ""
            )
            .slice(0, 18);

        // ===============================================
        // CREAR TICKET
        // ===============================================

        const ticket =
          await interaction.guild.channels.create({

            name:
              `${data.emoji}・ticket-${username}`,

            type:
              ChannelType.GuildText,

            parent:
              CONFIG.TICKET_CATEGORY,

            topic:
              `ticket:${interaction.user.id}`,

            permissionOverwrites: [

              {
                id:
                  interaction.guild.id,

                deny: [
                  PermissionsBitField.Flags.ViewChannel
                ]
              },

              {
                id:
                  interaction.user.id,

                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ReadMessageHistory,
                  PermissionsBitField.Flags.AttachFiles
                ]
              },

              {
                id:
                  CONFIG.STAFF_ROLE,

                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ReadMessageHistory,
                  PermissionsBitField.Flags.AttachFiles,
                  PermissionsBitField.Flags.ManageMessages
                ]
              }

            ]

          });

        await interaction.reply({

          content:
            `🎫 Ticket creado: ${ticket}`,

          ephemeral: true

        });

        await ticket.send({

          content:
            `<@&${CONFIG.STAFF_ROLE}> <@${interaction.user.id}>`,

          embeds: [

            new EmbedBuilder()

              .setColor(
                data.color
              )

              .setTitle(
                `${data.emoji}・𝐓𝐈𝐂𝐊𝐄𝐓 ${data.name.toUpperCase()}`
              )

              .setDescription(
                `👋 **¡Bienvenido a DICA STUDIO!**

Tu solicitud de **${data.name}** ha sido aceptada automáticamente.

Selecciona una opción en el menú para continuar.

────────────────

📋 **RECUERDA**

✦ Explica tu solicitud claramente.
✦ Proporciona toda la información necesaria.
✦ Mantén el respeto hacia el Staff.

✨ **DICA STUDIO**
*Creamos. Diseñamos. Innovamos.*`
              )

          ],

          components: [

            categoryMenu(
              category
            ),

            ticketButtons()

          ]

        });

        // ===============================================
        // LOG
        // ===============================================

        await sendLog(

          interaction.guild,

          new EmbedBuilder()

            .setColor(
              0x57F287
            )

            .setTitle(
              "🎫・𝐓𝐈𝐂𝐊𝐄𝐓 𝐂𝐑𝐄𝐀𝐃𝐎"
            )

            .setDescription(
              `👤 **Usuario:** ${interaction.user}\n\n` +
              `🎫 **Ticket:** ${ticket}\n\n` +
              `📂 **Categoría:** ${data.emoji} ${data.name}`
            )

            .setTimestamp()

        );

        return;
      }

      // ==================================================
      // MENÚ INTERNO
      // ==================================================

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId.startsWith(
          "ticket_type:"
        )
      ) {

        const category =
          interaction.customId.split(":")[1];

        const selected =
          interaction.values[0];

        const data =
          categories[category];

        const type =
          data.options.find(
            option =>
              option[0] === selected
          );

        if (!type) return;

        const modal =
          new ModalBuilder()
            .setCustomId(
              `questions:${category}:${selected}`
            )
            .setTitle(
              `${data.name} • ${type[2]}`
            );

        data.questions
          .slice(0, 5)
          .forEach(
            ([id, label, style]) => {

              const input =
                new TextInputBuilder()

                  .setCustomId(id)

                  .setLabel(
                    label.slice(
                      0,
                      45
                    )
                  )

                  .setStyle(style)

                  .setRequired(true);

              modal.addComponents(

                new ActionRowBuilder()
                  .addComponents(
                    input
                  )

              );

            }
          );

        return interaction.showModal(
          modal
        );
      }

      // ==================================================
      // MODAL DE PREGUNTAS
      // ==================================================

      if (
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(
          "questions:"
        )
      ) {

        const parts =
          interaction.customId.split(":");

        const category =
          parts[1];

        const selected =
          parts[2];

        const data =
          categories[category];

        const type =
          data.options.find(
            option =>
              option[0] === selected
          );

        const answers =
          data.questions
            .slice(0, 5)
            .map(
              ([id, question]) => {

                return {
                  question,
                  answer:
                    interaction.fields.getTextInputValue(
                      id
                    )
                };

              }
            );

        const requestChannel =
          interaction.guild.channels.cache.get(
            CONFIG.REQUEST_CHANNEL
          );

        if (
          !requestChannel?.isTextBased()
        ) {

          return interaction.reply({
            content:
              "❌ Canal de solicitudes no encontrado.",
            ephemeral: true
          });

        }

        const description =
          answers
            .map(
              item =>
                `**${item.question}**\n> ${item.answer}`
            )
            .join("\n\n");

        const embed =
          new EmbedBuilder()

            .setColor(
              data.color
            )

            .setTitle(
              "📨・𝐍𝐔𝐄𝐕𝐀 𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃"
            )

            .setDescription(
              `👤 **Usuario:** ${interaction.user}\n\n` +
              `🎫 **Ticket:** ${interaction.channel}\n\n` +
              `📂 **Categoría:** ${data.emoji} ${data.name}\n\n` +
              `📌 **Tipo:** ${type[2]}\n\n` +
              `────────────────\n\n` +
              description +
              `\n\n────────────────\n\n` +
              `🟡 **Estado:** Pendiente`
            )

            .setTimestamp();

        const buttons =
          new ActionRowBuilder()
            .addComponents(

              new ButtonBuilder()
                .setCustomId(
                  `claim:${interaction.channel.id}:${interaction.user.id}:${category}`
                )
                .setLabel(
                  "Reclamar"
                )
                .setEmoji("📌")
                .setStyle(
                  ButtonStyle.Primary
                ),

              new ButtonBuilder()
                .setCustomId(
                  `reject:${interaction.channel.id}:${interaction.user.id}:${category}`
                )
                .setLabel(
                  "Rechazar"
                )
                .setEmoji("❌")
                .setStyle(
                  ButtonStyle.Danger
                )

            );

        await requestChannel.send({

          content:
            `<@&${CONFIG.STAFF_ROLE}>`,

          embeds: [
            embed
          ],

          components: [
            buttons
          ]

        });

        return interaction.reply({

          content:
            "✅ Tu solicitud fue enviada al Staff. Espera la revisión.",

          ephemeral: true

        });
      }

      // ==================================================
      // RECLAMAR
      // ==================================================

      if (
        interaction.isButton() &&
        interaction.customId.startsWith(
          "claim:"
        )
      ) {

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ Solo el Staff puede reclamar solicitudes.",
            ephemeral: true
          });

        }

        const parts =
          interaction.customId.split(":");

        const channelId =
          parts[1];

        const userId =
          parts[2];

        const category =
          parts[3];

        const channel =
          interaction.guild.channels.cache.get(
            channelId
          );

        const embed =
          EmbedBuilder.from(
            interaction.message.embeds[0]
          )
            .setColor(
              0x57F287
            )
            .setDescription(
              interaction.message.embeds[0].description +
              `\n\n🟢 **𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃 𝐀𝐂𝐄𝐏𝐓𝐀𝐃𝐀**\n👮 Staff: ${interaction.user}`
            );

        await interaction.update({

          embeds: [
            embed
          ],

          components: []

        });

        if (channel) {

          await channel.send(
            `📌 **Solicitud aceptada y reclamada por ${interaction.user}.**`
          );

        }

        // NOTIFICACIÓN AL CANAL DE LOG/SOLICITUD
        await sendLog(

          interaction.guild,

          new EmbedBuilder()

            .setColor(
              0x57F287
            )

            .setTitle(
              "🟢・𝐓𝐈𝐂𝐊𝐄𝐓 𝐀𝐂𝐄𝐏𝐓𝐀𝐃𝐎"
            )

            .setDescription(
              `👤 **Usuario:** <@${userId}>\n\n` +
              `👮 **Staff:** ${interaction.user}\n\n` +
              `📂 **Categoría:** ${categories[category]?.name || category}\n\n` +
              `🟢 **Estado:** Aceptado`
            )

            .setTimestamp()

        );

        return;
      }

      // ==================================================
      // RECHAZAR
      // ==================================================

      if (
        interaction.isButton() &&
        interaction.customId.startsWith(
          "reject:"
        )
      ) {

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ Solo el Staff puede rechazar.",
            ephemeral: true
          });

        }

        const parts =
          interaction.customId.split(":");

        const channelId =
          parts[1];

        const userId =
          parts[2];

        const category =
          parts[3];

        const modal =
          new ModalBuilder()
            .setCustomId(
              `reject:${channelId}:${userId}:${category}`
            )
            .setTitle(
              "❌・Rechazar solicitud"
            );

        const reason =
          new TextInputBuilder()
            .setCustomId(
              "reason"
            )
            .setLabel(
              "Motivo del rechazo"
            )
            .setStyle(
              TextInputStyle.Paragraph
            )
            .setRequired(true);

        modal.addComponents(

          new ActionRowBuilder()
            .addComponents(
              reason
            )

        );

        return interaction.showModal(
          modal
        );
      }

      // ==================================================
      // RECHAZO MODAL
      // ==================================================

      if (
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(
          "reject:"
        )
      ) {

        const parts =
          interaction.customId.split(":");

        const userId =
          parts[2];

        const category =
          parts[3];

        const reason =
          interaction.fields.getTextInputValue(
            "reason"
          );

        const requestChannel =
          interaction.guild.channels.cache.get(
            CONFIG.REQUEST_CHANNEL
          );

        if (
          requestChannel?.isTextBased()
        ) {

          await requestChannel.send({

            embeds: [

              new EmbedBuilder()

                .setColor(
                  0xED4245
                )

                .setTitle(
                  "🔴・𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃 𝐑𝐄𝐂𝐇𝐀𝐙𝐀𝐃𝐀"
                )

                .setDescription(
                  `👤 **Usuario:** <@${userId}>\n\n` +
                  `📂 **Categoría:** ${categories[category]?.name || category}\n\n` +
                  `👮 **Staff:** ${interaction.user}\n\n` +
                  `🔴 **Estado:** Rechazado\n\n` +
                  `📝 **Motivo:**\n> ${reason}`
                )

                .setTimestamp()

            ]

          });

        }

        const user =
          await client.users
            .fetch(userId)
            .catch(() => null);

        if (user) {

          await user.send(

            `🔴 **𝐓𝐔 𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃 𝐅𝐔𝐄 𝐑𝐄𝐂𝐇𝐀𝐙𝐀𝐃𝐀**\n\n` +

            `Tu solicitud en **DICA STUDIO** fue rechazada.\n\n` +

            `📝 **Motivo:**\n> ${reason}\n\n` +

            `👮 **Staff:** ${interaction.user}`

          ).catch(() => {});

        }

        return interaction.reply({

          content:
            "🔴 Solicitud rechazada y notificada.",

          ephemeral: true

        });
      }

      // ==================================================
      // AÑADIR
      // ==================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          "ticket_add"
      ) {

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ Solo Staff.",
            ephemeral: true
          });

        }

        const modal =
          new ModalBuilder()
            .setCustomId(
              "add_user"
            )
            .setTitle(
              "➕・Añadir usuario"
            );

        const id =
          new TextInputBuilder()
            .setCustomId(
              "id"
            )
            .setLabel(
              "ID del usuario"
            )
            .setPlaceholder(
              "123456789012345678"
            )
            .setStyle(
              TextInputStyle.Short
            )
            .setRequired(true);

        modal.addComponents(

          new ActionRowBuilder()
            .addComponents(
              id
            )

        );

        return interaction.showModal(
          modal
        );
      }

      // ==================================================
      // AÑADIR USUARIO CONFIRMADO
      // ==================================================

      if (
        interaction.isModalSubmit() &&
        interaction.customId ===
          "add_user"
      ) {

        const id =
          interaction.fields.getTextInputValue(
            "id"
          );

        const member =
          await interaction.guild.members
            .fetch(id)
            .catch(() => null);

        if (!member) {

          return interaction.reply({
            content:
              "❌ Usuario no encontrado.",
            ephemeral: true
          });

        }

        await interaction.channel
          .permissionOverwrites
          .edit(
            member.id,
            {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true,
              AttachFiles: true
            }
          );

        return interaction.reply({

          content:
            `✅ ${member} fue añadido al ticket.`

        });
      }

      // ==================================================
      // CERRAR
      // ==================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          "ticket_close"
      ) {

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ Solo Staff puede cerrar tickets.",
            ephemeral: true
          });

        }

        const buttons =
          new ActionRowBuilder()
            .addComponents(

              new ButtonBuilder()
                .setCustomId(
                  "confirm_close"
                )
                .setLabel(
                  "Confirmar cierre"
                )
                .setEmoji("🔒")
                .setStyle(
                  ButtonStyle.Danger
                ),

              new ButtonBuilder()
                .setCustomId(
                  "cancel_close"
                )
                .setLabel(
                  "Cancelar"
                )
                .setEmoji("❌")
                .setStyle(
                  ButtonStyle.Secondary
                )

            );

        return interaction.reply({

          content:
            "⚠️ **¿Seguro que quieres cerrar este ticket?**",

          components: [
            buttons
          ]

        });
      }

      // ==================================================
      // CANCELAR
      // ==================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          "cancel_close"
      ) {

        return interaction.update({

          content:
            "❌ Cierre cancelado.",

          components: []

        });
      }

      // ==================================================
      // CONFIRMAR CIERRE
      // ==================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          "confirm_close"
      ) {

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ Solo Staff.",
            ephemeral: true
          });

        }

        const channel =
          interaction.channel;

        const topic =
          channel.topic || "";

        const userId =
          topic.startsWith(
            "ticket:"
          )
            ? topic.split(":")[1]
            : null;

        await interaction.update({

          content:
            "🔒 Cerrando ticket...",

          components: []

        });

        // LOG
        await sendLog(

          interaction.guild,

          new EmbedBuilder()

            .setColor(
              0xED4245
            )

            .setTitle(
              "🔒・𝐓𝐈𝐂𝐊𝐄𝐓 𝐂𝐄𝐑𝐑𝐀𝐃𝐎"
            )

            .setDescription(
              `🎫 **Canal:** #${channel.name}\n\n` +
              `👤 **Usuario:** ${
                userId
                  ? `<@${userId}>`
                  : "Desconocido"
              }\n\n` +
              `👮 **Cerrado por:** ${interaction.user}\n\n` +
              `🔴 **Estado:** Cerrado`
            )

            .setTimestamp()

        );

        // MD
        if (userId) {

          const user =
            await client.users
              .fetch(userId)
              .catch(() => null);

          if (user) {

            await user.send(

              `🔒 **𝐓𝐈𝐂𝐊𝐄𝐓 𝐂𝐄𝐑𝐑𝐀𝐃𝐎**\n\n` +

              `Tu ticket en **DICA STUDIO** fue cerrado.\n\n` +

              `🎫 **Ticket:** #${channel.name}\n\n` +

              `👮 **Cerrado por:** ${interaction.user}\n\n` +

              `✨ Gracias por contactar con nosotros.`

            ).catch(() => {});

          }

        }

        setTimeout(
          () => {

            channel.delete(
              "Ticket cerrado"
            ).catch(() => {});

          },
          5000
        );

      }

    } catch (error) {

      console.error(
        "❌ Error:",
        error
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {

        await interaction.reply({

          content:
            "❌ Ocurrió un error.",

          ephemeral: true

        }).catch(() => {});

      }

    }

  }
);

// ======================================================
// ERRORES
// ======================================================

process.on(
  "unhandledRejection",
  error =>
    console.error(
      "❌ Unhandled Rejection:",
      error
    )
);

process.on(
  "uncaughtException",
  error =>
    console.error(
      "❌ Uncaught Exception:",
      error
    )
);

// ======================================================
// LOGIN
// ======================================================

if (!process.env.DISCORD_TOKEN) {

  console.error(
    "❌ Falta DISCORD_TOKEN en .env"
  );

  process.exit(1);
}

if (!process.env.CLIENT_ID) {

  console.error(
    "❌ Falta CLIENT_ID en .env"
  );

  process.exit(1);
}

client.login(
  process.env.DISCORD_TOKEN
);
