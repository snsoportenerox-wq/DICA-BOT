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

// =====================================================
// EXPRESS
// =====================================================

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).send("🟢 DICA STUDIO Bot está online.");
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: client.user?.tag || "connecting",
    uptime: process.uptime()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Express iniciado en el puerto ${PORT}`);
});

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// =====================================================
// CONFIGURACIÓN
// =====================================================

const CONFIG = {
  PANEL_CHANNEL: "1514355453742551102",

  LOG_CHANNEL: "1539791936058163241",

  REQUEST_CHANNEL: "1540814503607009330",

  TICKET_CATEGORY: "1540814776878374943",

  STAFF_ROLE: "1540815218689441812",

  BOT_INVITE:
    "https://discord.com/oauth2/authorize?client_id=1530755091047387263"
};

// =====================================================
// CATEGORÍAS DE TICKETS
// =====================================================

const categories = {

  soporte: {
    name: "Soporte",
    emoji: "🛠️",
    color: 0x5865F2,

    options: [
      ["error", "🐛", "Reportar un error", "Reporta un error"],
      ["tecnico", "⚙️", "Problema técnico", "Problema técnico"],
      ["ayuda", "❓", "Ayuda general", "Solicita ayuda"],
      ["config", "🔧", "Configuración", "Ayuda con configuración"],
      ["staff", "📞", "Hablar con soporte", "Hablar con soporte"]
    ],

    questions: [
      ["problema", "¿Qué problema tienes?", TextInputStyle.Paragraph],
      ["detalles", "Describe el problema", TextInputStyle.Paragraph],
      ["pruebas", "¿Tienes pruebas?", TextInputStyle.Paragraph],
      ["extra", "Información adicional", TextInputStyle.Paragraph]
    ]
  },

  servicios: {
    name: "Servicios",
    emoji: "💼",
    color: 0x9B59B6,

    options: [
      ["diseno", "🎨", "Diseño", "Solicitar un diseño"],
      ["desarrollo", "💻", "Desarrollo", "Solicitar desarrollo"],
      ["logo", "🖼️", "Logo / Banner", "Solicitar logo o banner"],
      ["bot", "🤖", "Bot", "Solicitar un bot"],
      ["otro", "🌐", "Otro servicio", "Otro servicio"]
    ],

    questions: [
      ["servicio", "¿Qué servicio necesitas?", TextInputStyle.Short],
      ["descripcion", "Describe lo que necesitas", TextInputStyle.Paragraph],
      ["referencia", "¿Tienes alguna referencia?", TextInputStyle.Paragraph],
      ["presupuesto", "¿Presupuesto aproximado?", TextInputStyle.Short],
      ["extra", "¿Algún requisito adicional?", TextInputStyle.Paragraph]
    ]
  },

  compras: {
    name: "Compras",
    emoji: "💰",
    color: 0x57F287,

    options: [
      ["comprar", "🛒", "Comprar un servicio", "Realizar una compra"],
      ["pago", "💳", "Métodos de pago", "Consultar métodos de pago"],
      ["pedido", "📦", "Consultar pedido", "Consultar pedido"],
      ["problema", "🔄", "Problema con compra", "Problema con una compra"],
      ["precios", "❓", "Información de precios", "Consultar precios"]
    ],

    questions: [
      ["producto", "¿Qué quieres comprar?", TextInputStyle.Short],
      ["cantidad", "¿Qué cantidad necesitas?", TextInputStyle.Short],
      ["metodo", "¿Método de pago?", TextInputStyle.Short],
      ["detalles", "Detalles de la compra", TextInputStyle.Paragraph]
    ]
  },

  consultas: {
    name: "Consultas",
    emoji: "📩",
    color: 0x3498DB,

    options: [
      ["general", "💬", "Consulta general", "Consulta general"],
      ["informacion", "📋", "Información", "Solicitar información"],
      ["colaboracion", "🤝", "Colaboraciones", "Proponer colaboración"],
      ["otra", "❓", "Otra consulta", "Otra consulta"]
    ],

    questions: [
      ["consulta", "¿Cuál es tu consulta?", TextInputStyle.Paragraph],
      ["detalles", "Explica tu consulta", TextInputStyle.Paragraph],
      ["extra", "Información adicional", TextInputStyle.Paragraph]
    ]
  },

  reportes: {
    name: "Reportes",
    emoji: "🚨",
    color: 0xED4245,

    options: [
      ["usuario", "👤", "Reportar usuario", "Reportar un usuario"],
      ["bot", "🤖", "Reportar bot", "Reportar un bot"],
      ["staff", "🛡️", "Reportar staff", "Reportar a Staff"],
      ["error", "🐛", "Reportar error", "Reportar un error"],
      ["pruebas", "📎", "Enviar pruebas", "Enviar pruebas"]
    ],

    questions: [
      ["reportado", "¿A quién reportas?", TextInputStyle.Short],
      ["motivo", "Motivo del reporte", TextInputStyle.Paragraph],
      ["pruebas", "¿Qué pruebas tienes?", TextInputStyle.Paragraph],
      ["fecha", "¿Cuándo ocurrió?", TextInputStyle.Short],
      ["extra", "Información adicional", TextInputStyle.Paragraph]
    ]
  }
};

// =====================================================
// COMANDOS
// =====================================================

const commands = [

  // MODERACIÓN

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banea a un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario que quieres banear.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón del baneo.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Desbanea a un usuario mediante su ID.")
    .addStringOption(option =>
      option
        .setName("id")
        .setDescription("ID del usuario.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa a un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Aplica timeout a un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minutos")
        .setDescription("Duración en minutos.")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Quita el timeout a un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Advierte a un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Muestra las advertencias de un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Elimina mensajes.")
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad de mensajes.")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Configura el slowmode.")
    .addIntegerOption(option =>
      option
        .setName("segundos")
        .setDescription("Segundos.")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    ),

  // USUARIOS

  new SlashCommandBuilder()
    .setName("user-info")
    .setDescription("Muestra información de un usuario mediante ID.")
    .addStringOption(option =>
      option
        .setName("id")
        .setDescription("ID del usuario.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Muestra el avatar de un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("roles")
    .setDescription("Muestra los roles de un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("server-info")
    .setDescription("Muestra información del servidor."),

  // BOT

  new SlashCommandBuilder()
    .setName("bot-info")
    .setDescription("Muestra información del bot."),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra todos los comandos."),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Muestra la latencia del bot."),

  new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Obtén el enlace para invitar el bot."),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Muestra las estadísticas del bot.")

].map(command => command.toJSON());

// =====================================================
// REGISTRAR COMANDOS
// =====================================================

async function registerCommands() {

  const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

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
      `✅ ${commands.length} comandos registrados.`
    );

  } catch (error) {

    console.error(
      "❌ Error registrando comandos:",
      error
    );

  }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function isStaff(interaction) {

  return interaction.member.roles.cache.has(
    CONFIG.STAFF_ROLE
  );
}

async function sendLog(guild, embed) {

  const channel =
    guild.channels.cache.get(
      CONFIG.LOG_CHANNEL
    );

  if (channel?.isTextBased()) {
    await channel.send({
      embeds: [embed]
    }).catch(() => {});
  }
}

// =====================================================
// PANEL
// =====================================================

function createPanelEmbed() {

  return new EmbedBuilder()

    .setColor(0x8E44AD)

    .setTitle(
      "🎫・𝐓𝐈𝐂𝐊𝐄𝐓𝐒 — 𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎"
    )

    .setDescription(`«✦・𝐁𝐈𝐄𝐍𝐕𝐄𝐍𝐈𝐃𝐎 𝐀𝐋 𝐒𝐈𝐒𝐓𝐄𝐌𝐀 𝐃𝐄 𝐒𝐎𝐏𝐎𝐑𝐓𝐄・✦

╭─────────────── ✦ ───────────────╮
🎨・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎
✦・Diseño • Desarrollo • Creatividad・✦
╰─────────────── ✦ ───────────────╯

🎟️ ¿𝐍𝐄𝐂𝐄𝐒𝐈𝐓𝐀𝐒 𝐀𝐘𝐔𝐃𝐀?

Nuestro sistema de tickets está diseñado para brindarte una atención rápida, organizada y personalizada.

Selecciona la opción que mejor describa tu solicitud y nuestro equipo te atenderá.

────────────────

🛠️ 𝐒𝐎𝐏𝐎𝐑𝐓𝐄

«¿Tienes algún problema o necesitas asistencia?»

💼 𝐒𝐄𝐑𝐕𝐈𝐂𝐈𝐎𝐒

«¿Quieres información sobre nuestros servicios o realizar una solicitud?»

💰 𝐂𝐎𝐌𝐏𝐑𝐀𝐒

«¿Deseas adquirir alguno de nuestros productos o servicios?»

📩 𝐂𝐎𝐍𝐒𝐔𝐋𝐓𝐀𝐒

«Para dudas, preguntas o cualquier otra información.»

🚨 𝐑𝐄𝐏𝐎𝐑𝐓𝐄𝐒

«Informa sobre problemas, errores o situaciones que debamos revisar.»

────────────────

📋 𝐑𝐄𝐂𝐔𝐄𝐑𝐃𝐀

«✦ Explica tu solicitud con claridad.
✦ Proporciona pruebas cuando sea necesario.
✦ No abras varios tickets por el mismo asunto.
✦ Mantén el respeto hacia nuestro equipo.»

✨ 𝐓𝐔 𝐒𝐀𝐓𝐈𝐒𝐅𝐀𝐂𝐂𝐈Ó𝐍 𝐄𝐒 𝐍𝐔𝐄𝐒𝐓𝐑𝐀 𝐏𝐑𝐈𝐎𝐑𝐈𝐃𝐀𝐃.

🎨・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎
Creamos. Diseñamos. Innovamos.`);

}

// =====================================================
// MENÚ PRINCIPAL
// =====================================================

function createMainMenu() {

  return new ActionRowBuilder()
    .addComponents(

      new StringSelectMenuBuilder()

        .setCustomId("ticket_category")

        .setPlaceholder(
          "🎫・Selecciona una opción para abrir un ticket..."
        )

        .addOptions(

          Object.entries(categories).map(
            ([id, category]) =>

              new StringSelectMenuOptionBuilder()
                .setLabel(category.name)
                .setDescription(
                  `Abrir un ticket de ${category.name}`
                )
                .setEmoji(category.emoji)
                .setValue(id)
          )

        )
    );
}

// =====================================================
// BOTÓN INVITAR BOT
// =====================================================

function createInviteButton() {

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setLabel(
          "🤖・Invitar uno de nuestros bots"
        )
        .setStyle(ButtonStyle.Link)
        .setURL(CONFIG.BOT_INVITE)

    );
}

// =====================================================
// MENÚ DENTRO DEL TICKET
// =====================================================

function createCategoryMenu(category) {

  const data = categories[category];

  return new ActionRowBuilder()
    .addComponents(

      new StringSelectMenuBuilder()

        .setCustomId(
          `ticket_type:${category}`
        )

        .setPlaceholder(
          `${data.emoji}・Selecciona una opción...`
        )

        .addOptions(

          data.options.map(
            ([value, emoji, label, description]) =>

              new StringSelectMenuOptionBuilder()
                .setLabel(label)
                .setDescription(description)
                .setEmoji(emoji)
                .setValue(value)
          )

        )
    );
}

// =====================================================
// BOTONES DEL TICKET
// =====================================================

function createTicketButtons() {

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("ticket_add")
        .setLabel("Añadir")
        .setEmoji("➕")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Cerrar")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)

    );
}

// =====================================================
// EMBED DE BIENVENIDA
// =====================================================

function createWelcomeEmbed(category) {

  const data = categories[category];

  return new EmbedBuilder()

    .setColor(data.color)

    .setTitle(
      `${data.emoji}・𝐓𝐈𝐂𝐊𝐄𝐓 𝐃𝐄 ${data.name.toUpperCase()}`
    )

    .setDescription(`👋 **¡Bienvenido a tu ticket de ${data.name}!**

Nuestro equipo de **DICA STUDIO** está aquí para ayudarte.

${data.emoji} Selecciona una opción en el menú de abajo para continuar.

────────────────

📋 **𝐑𝐄𝐂𝐔𝐄𝐑𝐃𝐀**

✦ Explica tu solicitud claramente.
✦ Proporciona pruebas cuando sea necesario.
✦ Mantén el respeto hacia nuestro equipo.

✨ **DICA STUDIO**
*Creamos. Diseñamos. Innovamos.*`)

    .setFooter({
      text: "DICA STUDIO • Sistema de Tickets"
    });
}

// =====================================================
// ENVIAR PANEL AUTOMÁTICAMENTE
// =====================================================

async function sendPanel() {

  for (const guild of client.guilds.cache.values()) {

    const channel =
      guild.channels.cache.get(
        CONFIG.PANEL_CHANNEL
      );

    if (!channel?.isTextBased()) {
      console.log("❌ Canal del panel no encontrado.");
      continue;
    }

    const messages =
      await channel.messages.fetch({
        limit: 20
      }).catch(() => null);

    if (!messages) continue;

    const exists =
      messages.some(message =>
        message.author.id === client.user.id &&
        message.embeds.length &&
        message.embeds[0].title ===
        "🎫・𝐓𝐈𝐂𝐊𝐄𝐓𝐒 — 𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎"
      );

    if (exists) {
      console.log("ℹ️ El panel ya existe.");
      continue;
    }

    await channel.send({

      embeds: [
        createPanelEmbed()
      ],

      components: [
        createMainMenu(),
        createInviteButton()
      ]

    });

    console.log(
      `🎫 Panel enviado en #${channel.name}`
    );
  }
}

// =====================================================
// READY
// =====================================================

client.once("ready", async () => {

  console.log(
    `✅ ${client.user.tag} está conectado.`
  );

  await registerCommands();

  await sendPanel();

  console.log(
    "🎫 Sistema DICA STUDIO iniciado."
  );
});

// =====================================================
// INTERACCIONES
// =====================================================

client.on(
  "interactionCreate",
  async interaction => {

    try {

      // =================================================
      // SLASH COMMANDS
      // =================================================

      if (interaction.isChatInputCommand()) {

        // ===============================================
        // BAN
        // ===============================================

        if (interaction.commandName === "ban") {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.BanMembers
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso para banear usuarios.",
              ephemeral: true
            });

          }

          const user =
            interaction.options.getUser("usuario");

          const reason =
            interaction.options.getString("razon") ||
            "Sin razón especificada.";

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member) {

            return interaction.reply({
              content:
                "❌ Ese usuario no está en el servidor.",
              ephemeral: true
            });

          }

          if (!member.bannable) {

            return interaction.reply({
              content:
                "❌ No puedo banear a ese usuario. Revisa la jerarquía de roles.",
              ephemeral: true
            });

          }

          await member.ban({
            reason
          });

          await interaction.reply({
            content:
              `🔨 **${user.tag}** fue baneado.\n📝 Razón: ${reason}`
          });

          await sendLog(
            interaction.guild,

            new EmbedBuilder()
              .setColor(0xED4245)
              .setTitle("🔨・USUARIO BANEADO")
              .setDescription(
                `👤 **Usuario:** ${user}\n` +
                `🆔 **ID:** \`${user.id}\`\n` +
                `👮 **Moderador:** ${interaction.user}\n` +
                `📝 **Razón:** ${reason}`
              )
              .setTimestamp()
          );

          return;
        }

        // ===============================================
        // UNBAN
        // ===============================================

        if (interaction.commandName === "unban") {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.BanMembers
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso para desbanear.",
              ephemeral: true
            });

          }

          const id =
            interaction.options.getString("id");

          await interaction.guild.bans.remove(
            id
          );

          await interaction.reply({
            content:
              `✅ El usuario con ID \`${id}\` fue desbaneado.`
          });

          return;
        }

        // ===============================================
        // KICK
        // ===============================================

        if (interaction.commandName === "kick") {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.KickMembers
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso para expulsar usuarios.",
              ephemeral: true
            });

          }

          const user =
            interaction.options.getUser("usuario");

          const reason =
            interaction.options.getString("razon") ||
            "Sin razón especificada.";

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member?.kickable) {

            return interaction.reply({
              content:
                "❌ No puedo expulsar a ese usuario.",
              ephemeral: true
            });

          }

          await member.kick(reason);

          await interaction.reply({
            content:
              `👢 **${user.tag}** fue expulsado.\n📝 Razón: ${reason}`
          });

          return;
        }

        // ===============================================
        // TIMEOUT
        // ===============================================

        if (interaction.commandName === "timeout") {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.ModerateMembers
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso para aplicar timeout.",
              ephemeral: true
            });

          }

          const user =
            interaction.options.getUser("usuario");

          const minutes =
            interaction.options.getInteger("minutos");

          const reason =
            interaction.options.getString("razon") ||
            "Sin razón especificada.";

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member?.moderatable) {

            return interaction.reply({
              content:
                "❌ No puedo aplicar timeout a ese usuario.",
              ephemeral: true
            });

          }

          await member.timeout(
            minutes * 60 * 1000,
            reason
          );

          await interaction.reply({
            content:
              `⏱️ **${user.tag}** recibió timeout por **${minutes} minutos**.`
          });

          return;
        }

        // ===============================================
        // UNTIMEOUT
        // ===============================================

        if (interaction.commandName === "untimeout") {

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
            interaction.options.getUser("usuario");

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member?.moderatable) {

            return interaction.reply({
              content:
                "❌ No puedo modificar a ese usuario.",
              ephemeral: true
            });

          }

          await member.timeout(null);

          await interaction.reply({
            content:
              `✅ Timeout retirado a **${user.tag}**.`
          });

          return;
        }

        // ===============================================
        // WARN
        // ===============================================

        if (interaction.commandName === "warn") {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.ModerateMembers
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso para advertir.",
              ephemeral: true
            });

          }

          const user =
            interaction.options.getUser("usuario");

          const reason =
            interaction.options.getString("razon");

          await interaction.reply({
            content:
              `⚠️ **${user.tag}** recibió una advertencia.\n📝 ${reason}`
          });

          return;
        }

        // ===============================================
        // WARNINGS
        // ===============================================

        if (interaction.commandName === "warnings") {

          const user =
            interaction.options.getUser("usuario");

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFEE75C)
                .setTitle("⚠️・ADVERTENCIAS")
                .setDescription(
                  `👤 **Usuario:** ${user}\n\n` +
                  `📋 Sistema de advertencias conectado.`
                )
            ]
          });
        }

        // ===============================================
        // CLEAR
        // ===============================================

        if (interaction.commandName === "clear") {

          if (
            !interaction.memberPermissions.has(
              PermissionsBitField.Flags.ManageMessages
            )
          ) {

            return interaction.reply({
              content:
                "❌ No tienes permiso para borrar mensajes.",
              ephemeral: true
            });

          }

          const amount =
            interaction.options.getInteger("cantidad");

          await interaction.channel.bulkDelete(
            amount,
            true
          );

          return interaction.reply({
            content:
              `🧹 Se eliminaron **${amount} mensajes**.`,
            ephemeral: true
          });
        }

        // ===============================================
        // SLOWMODE
        // ===============================================

        if (interaction.commandName === "slowmode") {

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
              `🐌 Slowmode establecido en **${seconds} segundos**.`
          });
        }

        // ===============================================
        // USER INFO
        // ===============================================

        if (interaction.commandName === "user-info") {

          const id =
            interaction.options.getString("id");

          const user =
            await client.users
              .fetch(id)
              .catch(() => null);

          if (!user) {

            return interaction.reply({
              content:
                "❌ No encontré un usuario con esa ID.",
              ephemeral: true
            });

          }

          const member =
            await interaction.guild.members
              .fetch(id)
              .catch(() => null);

          const embed =
            new EmbedBuilder()
              .setColor(0x5865F2)
              .setTitle("👤・INFORMACIÓN DEL USUARIO")
              .setThumbnail(
                user.displayAvatarURL({
                  size: 1024
                })
              )
              .addFields(

                {
                  name: "👤 Usuario",
                  value: `${user}`,
                  inline: true
                },

                {
                  name: "🆔 ID",
                  value: `\`${user.id}\``,
                  inline: true
                },

                {
                  name: "🤖 Bot",
                  value: user.bot
                    ? "Sí"
                    : "No",
                  inline: true
                },

                {
                  name: "📅 Cuenta creada",
                  value:
                    `<t:${Math.floor(
                      user.createdTimestamp / 1000
                    )}:F>`,
                  inline: false
                },

                {
                  name: "📥 Entrada al servidor",
                  value:
                    member?.joinedTimestamp
                      ? `<t:${Math.floor(
                          member.joinedTimestamp / 1000
                        )}:F>`
                      : "No está en el servidor",
                  inline: false
                }

              )
              .setTimestamp();

          return interaction.reply({
            embeds: [embed]
          });
        }

        // ===============================================
        // AVATAR
        // ===============================================

        if (interaction.commandName === "avatar") {

          const user =
            interaction.options.getUser(
              "usuario"
            ) || interaction.user;

          const embed =
            new EmbedBuilder()
              .setColor(0x8E44AD)
              .setTitle(
                `🖼️・AVATAR DE ${user.username}`
              )
              .setImage(
                user.displayAvatarURL({
                  size: 4096,
                  extension: "png"
                })
              );

          return interaction.reply({
            embeds: [embed]
          });
        }

        // ===============================================
        // ROLES
        // ===============================================

        if (interaction.commandName === "roles") {

          const user =
            interaction.options.getUser(
              "usuario"
            ) || interaction.user;

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member) {

            return interaction.reply({
              content:
                "❌ Ese usuario no está en el servidor.",
              ephemeral: true
            });

          }

          const roles =
            member.roles.cache
              .filter(role =>
                role.id !== interaction.guild.id
              )
              .sort(
                (a, b) =>
                  b.position - a.position
              )
              .map(role => role.toString())
              .join(" ");

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(
                  `🎭・ROLES DE ${user.username}`
                )
                .setDescription(
                  roles ||
                  "Este usuario no tiene roles."
                )
            ]
          });
        }

        // ===============================================
        // SERVER INFO
        // ===============================================

        if (
          interaction.commandName ===
          "server-info"
        ) {

          const guild =
            interaction.guild;

          const embed =
            new EmbedBuilder()
              .setColor(0x5865F2)
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
                  value: `\`${guild.id}\``,
                  inline: true
                },

                {
                  name: "👥 Miembros",
                  value:
                    `${guild.memberCount}`,
                  inline: true
                },

                {
                  name: "💬 Canales",
                  value:
                    `${guild.channels.cache.size}`,
                  inline: true
                },

                {
                  name: "🎭 Roles",
                  value:
                    `${guild.roles.cache.size}`,
                  inline: true
                },

                {
                  name: "🚀 Boosts",
                  value:
                    `${guild.premiumSubscriptionCount || 0}`,
                  inline: true
                }

              )
              .setTimestamp();

          return interaction.reply({
            embeds: [embed]
          });
        }

        // ===============================================
        // BOT INFO
        // ===============================================

        if (
          interaction.commandName ===
          "bot-info"
        ) {

          const embed =
            new EmbedBuilder()
              .setColor(0x8E44AD)
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
                  value: "🟢 Online",
                  inline: true
                },

                {
                  name: "⚙️ Discord.js",
                  value: "v14",
                  inline: true
                },

                {
                  name: "⏱️ Uptime",
                  value:
                    `${Math.floor(
                      process.uptime()
                    )} segundos`,
                  inline: true
                }

              )
              .setFooter({
                text:
                  "DICA STUDIO • Creamos. Diseñamos. Innovamos."
              });

          return interaction.reply({
            embeds: [embed]
          });
        }

        // ===============================================
        // HELP
        // ===============================================

        if (
          interaction.commandName ===
          "help"
        ) {

          const embed =
            new EmbedBuilder()
              .setColor(0x8E44AD)
              .setTitle(
                "📚・𝐀𝐘𝐔𝐃𝐀 — 𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎"
              )
              .setDescription(`### 🛡️ Moderación

\`/ban\` • Banea usuarios
\`/unban\` • Desbanea por ID
\`/kick\` • Expulsa usuarios
\`/timeout\` • Aplica timeout
\`/untimeout\` • Quita timeout
\`/warn\` • Advierte usuarios
\`/warnings\` • Consulta advertencias
\`/clear\` • Elimina mensajes
\`/slowmode\` • Configura slowmode

### 👤 Usuarios

\`/user-info\` • Información por ID
\`/avatar\` • Muestra avatar
\`/roles\` • Muestra roles
\`/server-info\` • Información del servidor

### 🤖 Bot

\`/bot-info\` • Información del bot
\`/help\` • Lista de comandos
\`/ping\` • Latencia
\`/invite\` • Invitar bot
\`/stats\` • Estadísticas

🎫 **El sistema de tickets funciona automáticamente mediante el panel.**`);

          return interaction.reply({
            embeds: [embed]
          });
        }

        // ===============================================
        // PING
        // ===============================================

        if (
          interaction.commandName ===
          "ping"
        ) {

          return interaction.reply({
            content:
              `🏓 Pong!\n💻 API: **${client.ws.ping}ms**`
          });
        }

        // ===============================================
        // INVITE
        // ===============================================

        if (
          interaction.commandName ===
          "invite"
        ) {

          return interaction.reply({
            content:
              `🤖 **Invita a DICA STUDIO Bot:**\n${CONFIG.BOT_INVITE}`
          });
        }

        // ===============================================
        // STATS
        // ===============================================

        if (
          interaction.commandName ===
          "stats"
        ) {

          const totalMembers =
            client.guilds.cache.reduce(
              (total, guild) =>
                total + (guild.memberCount || 0),
              0
            );

          const embed =
            new EmbedBuilder()
              .setColor(0x8E44AD)
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
                    `${totalMembers}`,
                  inline: true
                },

                {
                  name: "📡 Ping",
                  value:
                    `${client.ws.ping}ms`,
                  inline: true
                }

              )
              .setTimestamp();

          return interaction.reply({
            embeds: [embed]
          });
        }
      }

      // =================================================
      // MENÚ PRINCIPAL DE TICKETS
      // =================================================

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
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 20);

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
            `🎫 Tu ticket fue creado: ${ticket}`,
          ephemeral: true
        });

        // ===============================================
        // MENSAJE DEL TICKET
        // ===============================================

        await ticket.send({

          content:
            `<@&${CONFIG.STAFF_ROLE}> <@${interaction.user.id}>`,

          embeds: [
            createWelcomeEmbed(category)
          ],

          components: [
            createCategoryMenu(category),
            createTicketButtons()
          ]

        });

        // ===============================================
        // LOG
        // ===============================================

        await sendLog(

          interaction.guild,

          new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle(
              "🎫・𝐓𝐈𝐂𝐊𝐄𝐓 𝐂𝐑𝐄𝐀𝐃𝐎"
            )
            .setDescription(
              `👤 **Usuario:** ${interaction.user}\n` +
              `🎫 **Ticket:** ${ticket}\n` +
              `📂 **Categoría:** ${data.emoji} ${data.name}\n` +
              `🟢 **Estado:** Abierto`
            )
            .setTimestamp()

        );

        return;
      }

      // =================================================
      // MENÚ DENTRO DEL TICKET
      // =================================================

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId.startsWith(
          "ticket_type:"
        )
      ) {

        const category =
          interaction.customId.split(":")[1];

        const typeId =
          interaction.values[0];

        const data =
          categories[category];

        const type =
          data.options.find(
            option =>
              option[0] === typeId
          );

        if (!type) return;

        const modal =
          new ModalBuilder()
            .setCustomId(
              `questions:${category}:${typeId}`
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
                    label.slice(0, 45)
                  )
                  .setStyle(style)
                  .setRequired(true);

              modal.addComponents(
                new ActionRowBuilder()
                  .addComponents(input)
              );
            }
          );

        await interaction.showModal(
          modal
        );

        return;
      }

      // =================================================
      // FORMULARIO
      // =================================================

      if (
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(
          "questions:"
        )
      ) {

        const [
          ,
          category,
          typeId
        ] =
          interaction.customId.split(":");

        const data =
          categories[category];

        const type =
          data.options.find(
            option =>
              option[0] === typeId
          );

        const answers =
          data.questions
            .slice(0, 5)
            .map(
              ([id, question]) => ({
                question,
                answer:
                  interaction.fields.getTextInputValue(
                    id
                  )
              })
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

        const answerText =
          answers
            .map(
              a =>
                `**${a.question}**\n> ${a.answer}`
            )
            .join("\n\n");

        const embed =
          new EmbedBuilder()
            .setColor(data.color)
            .setTitle(
              "🎫・𝐍𝐔𝐄𝐕𝐀 𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃"
            )
            .setDescription(
              `👤 **Usuario:** ${interaction.user}\n\n` +
              `🎫 **Ticket:** ${interaction.channel}\n\n` +
              `📂 **Categoría:** ${data.emoji} ${data.name}\n\n` +
              `📌 **Tipo:** ${type[2]}\n\n` +
              `────────────────\n\n` +
              `📝 **𝐑𝐄𝐒𝐏𝐔𝐄𝐒𝐓𝐀𝐒**\n\n` +
              answerText +
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
                .setLabel("Reclamar")
                .setEmoji("📌")
                .setStyle(
                  ButtonStyle.Primary
                ),

              new ButtonBuilder()
                .setCustomId(
                  `reject:${interaction.channel.id}:${interaction.user.id}:${category}`
                )
                .setLabel("Rechazar")
                .setEmoji("❌")
                .setStyle(
                  ButtonStyle.Danger
                )

            );

        await requestChannel.send({

          content:
            `<@&${CONFIG.STAFF_ROLE}>`,

          embeds: [embed],

          components: [buttons]

        });

        await interaction.reply({
          content:
            "✅ Tu solicitud fue enviada al Staff.",
          ephemeral: true
        });

        return;
      }

      // =================================================
      // RECLAMAR
      // =================================================

      if (
        interaction.isButton() &&
        interaction.customId.startsWith(
          "claim:"
        )
      ) {

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ Solo el Staff puede reclamar.",
            ephemeral: true
          });

        }

        const [
          ,
          channelId
        ] =
          interaction.customId.split(":");

        const channel =
          interaction.guild.channels.cache.get(
            channelId
          );

        const embed =
          EmbedBuilder.from(
            interaction.message.embeds[0]
          )
            .setColor(0xFEE75C)
            .setFooter({
              text:
                `Reclamado por ${interaction.user.tag}`
            });

        await interaction.update({
          embeds: [embed],
          components: []
        });

        if (channel) {

          await channel.send(
            `📌 **Solicitud reclamada por ${interaction.user}.**`
          );

        }

        return;
      }

      // =================================================
      // RECHAZAR
      // =================================================

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

        const [
          ,
          channelId,
          userId,
          category
        ] =
          interaction.customId.split(":");

        const modal =
          new ModalBuilder()
            .setCustomId(
              `reject_modal:${channelId}:${userId}:${category}`
            )
            .setTitle(
              "🔴 Rechazar solicitud"
            );

        const reason =
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel(
              "Motivo del rechazo"
            )
            .setStyle(
              TextInputStyle.Paragraph
            )
            .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder()
            .addComponents(reason)
        );

        await interaction.showModal(
          modal
        );

        return;
      }

      // =================================================
      // RECHAZO CONFIRMADO
      // =================================================

      if (
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(
          "reject_modal:"
        )
      ) {

        const [
          ,
          channelId,
          userId,
          category
        ] =
          interaction.customId.split(":");

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
                .setColor(0xED4245)
                .setTitle(
                  "🔴・𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃 𝐑𝐄𝐂𝐇𝐀𝐙𝐀𝐃𝐀"
                )
                .setDescription(
                  `👤 **Usuario:** <@${userId}>\n\n` +
                  `📂 **Categoría:** ${
                    categories[category]?.name ||
                    category
                  }\n\n` +
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

        await interaction.reply({
          content:
            "🔴 Solicitud rechazada.",
          ephemeral: true
        });

        return;
      }

      // =================================================
      // AÑADIR USUARIO
      // =================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          "ticket_add"
      ) {

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ Solo el Staff puede añadir usuarios.",
            ephemeral: true
          });

        }

        const modal =
          new ModalBuilder()
            .setCustomId(
              "add_user_modal"
            )
            .setTitle(
              "➕ Añadir usuario"
            );

        const input =
          new TextInputBuilder()
            .setCustomId("user_id")
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
            .addComponents(input)
        );

        await interaction.showModal(
          modal
        );

        return;
      }

      // =================================================
      // AÑADIR CONFIRMADO
      // =================================================

      if (
        interaction.isModalSubmit() &&
        interaction.customId ===
          "add_user_modal"
      ) {

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ Solo el Staff puede hacer esto.",
            ephemeral: true
          });

        }

        const userId =
          interaction.fields.getTextInputValue(
            "user_id"
          );

        const member =
          await interaction.guild.members
            .fetch(userId)
            .catch(() => null);

        if (!member) {

          return interaction.reply({
            content:
              "❌ Ese usuario no está en el servidor.",
            ephemeral: true
          });

        }

        await interaction.channel
          .permissionOverwrites
          .edit(member.id, {

            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true

          });

        await interaction.reply({
          content:
            `✅ ${member} fue añadido al ticket.`
        });

        return;
      }

      // =================================================
      // CERRAR TICKET
      // =================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          "ticket_close"
      ) {

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ Solo el Staff puede cerrar tickets.",
            ephemeral: true
          });

        }

        const row =
          new ActionRowBuilder()
            .addComponents(

              new ButtonBuilder()
                .setCustomId(
                  "confirm_close"
                )
                .setLabel(
                  "Confirmar cierre"
                )
                .setEmoji("✅")
                .setStyle(
                  ButtonStyle.Danger
                ),

              new ButtonBuilder()
                .setCustomId(
                  "cancel_close"
                )
                .setLabel("Cancelar")
                .setEmoji("❌")
                .setStyle(
                  ButtonStyle.Secondary
                )

            );

        await interaction.reply({

          content:
            "⚠️ **¿Estás seguro de que deseas cerrar este ticket?**",

          components: [row]

        });

        return;
      }

      // =================================================
      // CANCELAR CIERRE
      // =================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          "cancel_close"
      ) {

        await interaction.update({
          content:
            "❌ Cierre cancelado.",
          components: []
        });

        return;
      }

      // =================================================
      // CONFIRMAR CIERRE
      // =================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          "confirm_close"
      ) {

        if (!isStaff(interaction)) {

          return interaction.reply({
            content:
              "❌ Solo el Staff puede cerrar tickets.",
            ephemeral: true
          });

        }

        const channel =
          interaction.channel;

        const userId =
          channel.topic?.startsWith(
            "ticket:"
          )
            ? channel.topic.split(":")[1]
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
            .setColor(0xED4245)
            .setTitle(
              "🔒・𝐓𝐈𝐂𝐊𝐄𝐓 𝐂𝐄𝐑𝐑𝐀𝐃𝐎"
            )
            .setDescription(
              `🎫 **Ticket:** #${channel.name}\n\n` +
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
              `Tu ticket en **DICA STUDIO** ha sido cerrado.\n\n` +
              `🎫 **Ticket:** #${channel.name}\n\n` +
              `👮 **Cerrado por:** ${interaction.user}\n\n` +
              `✨ Gracias por contactar con **DICA STUDIO**.\n\n` +
              `*Creamos. Diseñamos. Innovamos.*`
            ).catch(() => {});

          }
        }

        setTimeout(() => {

          channel.delete(
            "Ticket cerrado"
          ).catch(() => {});

        }, 5000);

        return;
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
            "❌ Ocurrió un error procesando la acción.",
          ephemeral: true
        }).catch(() => {});

      }
    }
  }
);

// =====================================================
// ERRORES
// =====================================================

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

// =====================================================
// TOKEN
// =====================================================

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

// =====================================================
// LOGIN
// =====================================================

client.login(
  process.env.DISCORD_TOKEN
);
