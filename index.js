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
  ChannelType,
  PermissionsBitField,
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
  res.send("🟢 DICA STUDIO BOT ONLINE");
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: client.user?.tag || "connecting",
    uptime: process.uptime()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Express iniciado en puerto ${PORT}`);
});

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [
    Partials.Channel
  ]
});

// =====================================================
// CONFIGURACIÓN
// =====================================================

const CONFIG = {
  PANEL_CHANNEL: "1514355453742551102",

  LOG_CHANNEL: "1539791936058163241",

  REQUEST_CHANNEL: "1540814503607009330",

  NOTIFICATION_CHANNEL: "1540814776878374943",

  TICKET_CATEGORY: "1514355351712043141",

  STAFF_ROLE: "1540815218689441812"
};

// =====================================================
// CATEGORÍAS
// =====================================================

const CATEGORIES = {
  reporte: {
    name: "Reporte",
    emoji: "🚨",
    color: 0xed4245,

    options: [
      {
        value: "usuario",
        label: "Reportar usuario",
        emoji: "👤",
        description: "Reportar a un usuario"
      },
      {
        value: "staff",
        label: "Reportar Staff",
        emoji: "🛡️",
        description: "Reportar a un miembro del Staff"
      },
      {
        value: "estafa",
        label: "Reportar estafa",
        emoji: "💸",
        description: "Reportar una posible estafa"
      },
      {
        value: "otro",
        label: "Otro reporte",
        emoji: "📋",
        description: "Realizar otro reporte"
      }
    ],

    questions: [
      ["reportado", "¿A quién estás reportando?", TextInputStyle.Short],
      ["motivo", "¿Cuál es el motivo del reporte?", TextInputStyle.Paragraph],
      ["pruebas", "¿Cuáles son las pruebas?", TextInputStyle.Paragraph],
      ["fecha", "¿Cuándo ocurrió?", TextInputStyle.Short],
      ["extra", "Información adicional", TextInputStyle.Paragraph]
    ]
  },

  alianza: {
    name: "Alianza",
    emoji: "🤝",
    color: 0x5865f2,

    options: [
      {
        value: "alianza",
        label: "Solicitar alianza",
        emoji: "🤝",
        description: "Solicitar una alianza"
      },
      {
        value: "afiliacion",
        label: "Afiliación",
        emoji: "🌐",
        description: "Solicitar una afiliación"
      },
      {
        value: "colaboracion",
        label: "Colaboración",
        emoji: "✨",
        description: "Proponer una colaboración"
      }
    ],

    questions: [
      ["servidor", "Nombre del servidor", TextInputStyle.Short],
      ["invitacion", "Invitación del servidor", TextInputStyle.Short],
      ["miembros", "Cantidad de miembros", TextInputStyle.Short],
      ["propuesta", "Describe tu propuesta", TextInputStyle.Paragraph],
      ["extra", "Información adicional", TextInputStyle.Paragraph]
    ]
  },

  soporte: {
    name: "Soporte General",
    emoji: "🛠️",
    color: 0x9b59b6,

    options: [
      {
        value: "ayuda",
        label: "Ayuda general",
        emoji: "❓",
        description: "Solicitar ayuda"
      },
      {
        value: "problema",
        label: "Problema",
        emoji: "⚙️",
        description: "Informar un problema"
      },
      {
        value: "bot",
        label: "Problema con bot",
        emoji: "🤖",
        description: "Problema relacionado con un bot"
      },
      {
        value: "servicio",
        label: "Servicio",
        emoji: "💼",
        description: "Consultar un servicio"
      }
    ],

    questions: [
      ["asunto", "¿Cuál es tu asunto?", TextInputStyle.Short],
      ["descripcion", "Describe tu problema o solicitud", TextInputStyle.Paragraph],
      ["pruebas", "¿Tienes pruebas?", TextInputStyle.Paragraph],
      ["extra", "Información adicional", TextInputStyle.Paragraph]
    ]
  },

  postulacion: {
    name: "Postulación",
    emoji: "📋",
    color: 0x57f287,

    options: [
      {
        value: "staff",
        label: "Postulación Staff",
        emoji: "🛡️",
        description: "Postularte para Staff"
      },
      {
        value: "disenador",
        label: "Diseñador",
        emoji: "🎨",
        description: "Postularte como diseñador"
      },
      {
        value: "desarrollador",
        label: "Desarrollador",
        emoji: "💻",
        description: "Postularte como desarrollador"
      }
    ],

    questions: [
      ["edad", "¿Cuál es tu edad?", TextInputStyle.Short],
      ["experiencia", "¿Qué experiencia tienes?", TextInputStyle.Paragraph],
      ["motivo", "¿Por qué quieres postularte?", TextInputStyle.Paragraph],
      ["horario", "¿Cuánto tiempo tienes disponible?", TextInputStyle.Short],
      ["extra", "Información adicional", TextInputStyle.Paragraph]
    ]
  }
};

// =====================================================
// MEMORIA TEMPORAL
// =====================================================

const solicitudes = new Map();
const tickets = new Map();

// =====================================================
// FUNCIONES
// =====================================================

function crearMenuPrincipal() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_categoria")
    .setPlaceholder("🎫・Selecciona una opción para abrir un ticket")
    .addOptions(
      Object.entries(CATEGORIES).map(([value, data]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(data.name)
          .setValue(value)
          .setEmoji(data.emoji)
          .setDescription(`Abrir una solicitud de ${data.name.toLowerCase()}`)
      )
    );

  return new ActionRowBuilder().addComponents(menu);
}

function crearMenuCategoria(categoria) {
  const data = CATEGORIES[categoria];

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`subcategoria_${categoria}`)
    .setPlaceholder(`${data.emoji}・Selecciona una opción`);

  for (const option of data.options) {
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(option.label)
        .setValue(option.value)
        .setEmoji(option.emoji)
        .setDescription(option.description)
    );
  }

  return new ActionRowBuilder().addComponents(menu);
}

function crearBotonesSolicitud(id) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`reclamar_${id}`)
      .setLabel("Reclamar")
      .setEmoji("🙋")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`aceptar_${id}`)
      .setLabel("Aceptar")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`rechazar_${id}`)
      .setLabel("Rechazar")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger)
  );
}

function crearBotonesTicket() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_add")
      .setLabel("Añadir")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Cerrar")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );
}

function esStaff(member) {
  if (!member) return false;

  return (
    member.roles.cache.has(CONFIG.STAFF_ROLE) ||
    member.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
    member.permissions.has(PermissionsBitField.Flags.Administrator)
  );
}

async function enviarLog(guild, embed) {
  const canal = guild.channels.cache.get(CONFIG.LOG_CHANNEL);

  if (!canal) return;

  await canal.send({
    embeds: [embed]
  }).catch(() => {});
}

// =====================================================
// PANEL
// =====================================================

async function enviarPanel() {
  const canal = await client.channels.fetch(CONFIG.PANEL_CHANNEL).catch(() => null);

  if (!canal || !canal.isTextBased()) {
    console.log("❌ No se encontró el canal del panel.");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle("🎫・𝐓𝐈𝐂𝐊𝐄𝐓𝐒 — 𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎")
    .setDescription(
      [
        "「✦・𝐁𝐈𝐄𝐍𝐕𝐄𝐍𝐈𝐃𝐎 𝐀𝐋 𝐒𝐈𝐒𝐓𝐄𝐌𝐀 𝐃𝐄 𝐒𝐎𝐏𝐎𝐑𝐓𝐄・✦」",
        "",
        "╭─────────────── ✦ ───────────────╮",
        "🎨・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎",
        "✦・Diseño • Desarrollo • Creatividad・✦",
        "╰─────────────── ✦ ───────────────╯",
        "",
        "🎟️・**¿𝐍𝐄𝐂𝐄𝐒𝐈𝐓𝐀𝐒 𝐀𝐘𝐔𝐃𝐀?**",
        "",
        "Nuestro sistema de tickets está diseñado para ofrecerte",
        "una atención rápida, organizada y personalizada.",
        "",
        "Selecciona una categoría en el menú para comenzar.",
        "",
        "🚨・**𝐑𝐄𝐏𝐎𝐑𝐓𝐄**",
        "Informa sobre usuarios, Staff, estafas u otros problemas.",
        "",
        "🤝・**𝐀𝐋𝐈𝐀𝐍𝐙𝐀**",
        "Solicita alianzas, afiliaciones o colaboraciones.",
        "",
        "🛠️・**𝐒𝐎𝐏𝐎𝐑𝐓𝐄 𝐆𝐄𝐍𝐄𝐑𝐀𝐋**",
        "Obtén ayuda con problemas, servicios o bots.",
        "",
        "📋・**𝐏𝐎𝐒𝐓𝐔𝐋𝐀𝐂𝐈Ó𝐍**",
        "Postúlate para formar parte del equipo.",
        "",
        "────────────────────────",
        "",
        "📋・**𝐑𝐄𝐂𝐔𝐄𝐑𝐃𝐀**",
        "✦ Explica tu solicitud claramente.",
        "✦ Proporciona pruebas cuando sea necesario.",
        "✦ No abras solicitudes duplicadas.",
        "✦ Mantén el respeto hacia el Staff.",
        "",
        "✨・𝐓𝐔 𝐒𝐀𝐓𝐈𝐒𝐅𝐀𝐂𝐂𝐈Ó𝐍 𝐄𝐒 𝐍𝐔𝐄𝐒𝐓𝐑𝐀 𝐏𝐑𝐈𝐎𝐑𝐈𝐃𝐀𝐃.",
        "",
        "🎨・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎",
        "Creamos. Diseñamos. Innovamos."
      ].join("\n")
    )
    .setFooter({
      text: "DICA STUDIO • Sistema de soporte"
    });

  await canal.send({
    embeds: [embed],
    components: [crearMenuPrincipal()]
  });

  console.log("🎫 Panel enviado correctamente.");
}

// =====================================================
// READY
// =====================================================

client.once("ready", async () => {
  console.log(`🟢 Bot conectado como ${client.user.tag}`);
  console.log(`🆔 ID: ${client.user.id}`);

  const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

  const commandData = [

    new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Banea a un usuario")
      .addUserOption(option =>
        option
          .setName("usuario")
          .setDescription("Usuario a banear")
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
          .setDescription("Duración en minutos")
          .setMinValue(1)
          .setMaxValue(40320)
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("untimeout")
      .setDescription("Quita el timeout")
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
      .setName("clear")
      .setDescription("Elimina mensajes")
      .addIntegerOption(option =>
        option
          .setName("cantidad")
          .setDescription("Cantidad de mensajes")
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("user-info")
      .setDescription("Información de un usuario")
      .addUserOption(option =>
        option
          .setName("usuario")
          .setDescription("Usuario")
          .setRequired(false)
      ),

    new SlashCommandBuilder()
      .setName("server-info")
      .setDescription("Información del servidor"),

    new SlashCommandBuilder()
      .setName("bot-info")
      .setDescription("Información del bot"),

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
      .setName("ping")
      .setDescription("Muestra la latencia"),

    new SlashCommandBuilder()
      .setName("help")
      .setDescription("Muestra los comandos")

  ];

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: commandData.map(command => command.toJSON())
      }
    );

    console.log("✅ Comandos registrados.");
  } catch (error) {
    console.error("❌ Error registrando comandos:", error);
  }

  // Solo se envía el panel si no existe uno reciente.
  const canal = await client.channels
    .fetch(CONFIG.PANEL_CHANNEL)
    .catch(() => null);

  if (canal && canal.isTextBased()) {
    const mensajes = await canal.messages
      .fetch({ limit: 20 })
      .catch(() => null);

    const existe = mensajes?.some(
      msg =>
        msg.author.id === client.user.id &&
        msg.embeds?.[0]?.title?.includes("𝐓𝐈𝐂𝐊𝐄𝐓𝐒")
    );

    if (!existe) {
      await enviarPanel();
    }
  }
});

// =====================================================
// INTERACCIONES
// =====================================================

client.on("interactionCreate", async interaction => {

  try {

    // =================================================
    // MENÚ PRINCIPAL
    // =================================================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket_categoria"
    ) {

      const categoria = interaction.values[0];
      const data = CATEGORIES[categoria];

      if (!data) {
        return interaction.reply({
          content: "❌ Categoría inválida.",
          flags: 64
        });
      }

      const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle(`${data.emoji}・${data.name}`)
        .setDescription(
          [
            `Has seleccionado **${data.name}**.`,
            "",
            "Selecciona una opción específica:",
            "",
            "📝 Después de seleccionar la opción se te harán",
            "unas preguntas para preparar tu solicitud."
          ].join("\n")
        )
        .setFooter({
          text: "DICA STUDIO • Sistema de solicitudes"
        });

      return interaction.reply({
        embeds: [embed],
        components: [crearMenuCategoria(categoria)],
        flags: 64
      });
    }

    // =================================================
    // SUBMENÚ
    // =================================================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId.startsWith("subcategoria_")
    ) {

      const categoria = interaction.customId.replace(
        "subcategoria_",
        ""
      );

      const opcion = interaction.values[0];

      const data = CATEGORIES[categoria];

      if (!data) {
        return interaction.reply({
          content: "❌ Categoría inválida.",
          flags: 64
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`formulario_${categoria}_${opcion}`)
        .setTitle(`${data.emoji} ${data.name}`);

      for (const [id, label, style] of data.questions) {

        const input = new TextInputBuilder()
          .setCustomId(id)
          .setLabel(label.substring(0, 45))
          .setStyle(style)
          .setRequired(true);

        if (style === TextInputStyle.Short) {
          input.setMaxLength(100);
        } else {
          input.setMaxLength(1000);
        }

        modal.addComponents(
          new ActionRowBuilder().addComponents(input)
        );
      }

      return interaction.showModal(modal);
    }

    // =================================================
    // FORMULARIO
    // =================================================

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("formulario_")
    ) {

      const partes = interaction.customId.split("_");

      const categoria = partes[1];
      const opcion = partes[2];

      const data = CATEGORIES[categoria];

      if (!data) {
        return interaction.reply({
          content: "❌ Categoría inválida.",
          flags: 64
        });
      }

      const respuestas = {};

      for (const [id] of data.questions) {
        respuestas[id] = interaction.fields.getTextInputValue(id);
      }

      const solicitudId = `${interaction.user.id}_${Date.now()}`;

      solicitudes.set(solicitudId, {
        id: solicitudId,
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        categoria,
        opcion,
        respuestas,
        staffId: null,
        estado: "pendiente",
        createdAt: Date.now()
      });

      const canalSolicitudes = await client.channels
        .fetch(CONFIG.REQUEST_CHANNEL)
        .catch(() => null);

      if (!canalSolicitudes || !canalSolicitudes.isTextBased()) {
        return interaction.reply({
          content: "❌ No se encontró el canal de solicitudes.",
          flags: 64
        });
      }

      const campos = data.questions.map(([id, label]) => {

        const valor = respuestas[id] || "Sin respuesta";

        return {
          name: label,
          value: valor.substring(0, 1024),
          inline: false
        };
      });

      const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle(
          `${data.emoji} Nueva solicitud — ${data.name}`
        )
        .setDescription(
          [
            `👤 **Usuario:** <@${interaction.user.id}>`,
            `🆔 **ID:** \`${interaction.user.id}\``,
            `📂 **Categoría:** ${data.name}`,
            `🔹 **Opción:** ${opcion}`,
            "",
            "🛡️ Un miembro del Staff debe reclamar y revisar esta solicitud."
          ].join("\n")
        )
        .addFields(campos)
        .setTimestamp()
        .setFooter({
          text: `Solicitud: ${solicitudId}`
        });

      const mensaje = await canalSolicitudes.send({
        content: `<@&${CONFIG.STAFF_ROLE}>`,
        embeds: [embed],
        components: [
          crearBotonesSolicitud(solicitudId)
        ],
        allowedMentions: {
          roles: [CONFIG.STAFF_ROLE]
        }
      });

      solicitudes.get(solicitudId).messageId = mensaje.id;

      await interaction.reply({
        content:
          "✅ **Solicitud enviada correctamente.**\n\n" +
          `📨 El Staff revisará tu solicitud en <#${CONFIG.REQUEST_CHANNEL}>.\n` +
          "⏳ Si es aceptada, se creará tu ticket automáticamente.",
        flags: 64
      });

      const logEmbed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("📨 Nueva solicitud")
        .setDescription(
          `**Usuario:** <@${interaction.user.id}>\n` +
          `**Categoría:** ${data.name}\n` +
          `**Solicitud:** \`${solicitudId}\``
        )
        .setTimestamp();

      await enviarLog(interaction.guild, logEmbed);

      return;
    }

    // =================================================
    // RECLAMAR SOLICITUD
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("reclamar_")
    ) {

      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo el Staff puede reclamar solicitudes.",
          flags: 64
        });
      }

      const solicitudId = interaction.customId.replace(
        "reclamar_",
        ""
      );

      const solicitud = solicitudes.get(solicitudId);

      if (!solicitud) {
        return interaction.reply({
          content: "❌ Esta solicitud ya no está disponible.",
          flags: 64
        });
      }

      if (solicitud.estado !== "pendiente") {
        return interaction.reply({
          content: "❌ Esta solicitud ya fue procesada.",
          flags: 64
        });
      }

      solicitud.staffId = interaction.user.id;
      solicitud.estado = "reclamada";

      const nuevoEmbed = EmbedBuilder.from(
        interaction.message.embeds[0]
      )
        .setColor(0xf1c40f)
        .addFields({
          name: "🙋 Staff encargado",
          value: `<@${interaction.user.id}>`,
          inline: false
        });

      await interaction.update({
        embeds: [nuevoEmbed],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`reclamar_${solicitudId}`)
              .setLabel("Reclamada")
              .setEmoji("🙋")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),

            new ButtonBuilder()
              .setCustomId(`aceptar_${solicitudId}`)
              .setLabel("Aceptar")
              .setEmoji("✅")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId(`rechazar_${solicitudId}`)
              .setLabel("Rechazar")
              .setEmoji("❌")
              .setStyle(ButtonStyle.Danger)
          )
        ]
      );

      return;
    }

    // =================================================
    // ACEPTAR
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("aceptar_")
    ) {

      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo el Staff puede aceptar solicitudes.",
          flags: 64
        });
      }

      const solicitudId = interaction.customId.replace(
        "aceptar_",
        ""
      );

      const solicitud = solicitudes.get(solicitudId);

      if (!solicitud) {
        return interaction.reply({
          content: "❌ Solicitud no encontrada.",
          flags: 64
        });
      }

      if (solicitud.estado === "aceptada") {
        return interaction.reply({
          content: "❌ Esta solicitud ya fue aceptada.",
          flags: 64
        });
      }

      if (solicitud.estado === "rechazada") {
        return interaction.reply({
          content: "❌ Esta solicitud ya fue rechazada.",
          flags: 64
        });
      }

      const guild = interaction.guild;

      const categoria = guild.channels.cache.get(
        CONFIG.TICKET_CATEGORY
      );

      if (!categoria) {
        return interaction.reply({
          content: "❌ No se encontró la categoría de tickets.",
          flags: 64
        });
      }

      if (categoria.type !== ChannelType.GuildCategory) {
        return interaction.reply({
          content:
            "❌ El ID configurado en `TICKET_CATEGORY` no corresponde a una categoría de Discord.",
          flags: 64
        });
      }

      const usuario = await client.users
        .fetch(solicitud.userId)
        .catch(() => null);

      if (!usuario) {
        return interaction.reply({
          content: "❌ No se encontró al usuario.",
          flags: 64
        });
      }

      const nombreSeguro = usuario.username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 15) || "usuario";

      const ticket = await guild.channels.create({
        name: `ticket-${nombreSeguro}`,
        type: ChannelType.GuildText,
        parent: CONFIG.TICKET_CATEGORY,

        topic: `ticket:${solicitudId}`,

        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [
              PermissionsBitField.Flags.ViewChannel
            ]
          },
          {
            id: solicitud.userId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.AttachFiles
            ]
          },
          {
            id: CONFIG.STAFF_ROLE,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.AttachFiles,
              PermissionsBitField.Flags.ManageMessages
            ]
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.ManageMessages
            ]
          }
        ]
      });

      solicitud.estado = "aceptada";
      solicitud.ticketId = ticket.id;
      solicitud.acceptedBy = interaction.user.id;

      tickets.set(ticket.id, {
        ticketId: ticket.id,
        userId: solicitud.userId,
        staffId: solicitud.staffId || interaction.user.id,
        solicitudId,
        category: solicitud.categoria,
        createdAt: Date.now()
      });

      const data = CATEGORIES[solicitud.categoria];

      const ticketEmbed = new EmbedBuilder()
        .setColor(data?.color || 0x8b5cf6)
        .setTitle(
          `${data?.emoji || "🎫"}・𝐓𝐈𝐂𝐊𝐄𝐓 — 𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎`
        )
        .setDescription(
          [
            `👋 Bienvenido <@${solicitud.userId}>.`,
            "",
            `📂 **Categoría:** ${data?.name || solicitud.categoria}`,
            "",
            "Un miembro de nuestro equipo te atenderá lo antes posible.",
            "",
            "📋 **Solicitud**",
            `El Staff encargado es <@${solicitud.staffId || interaction.user.id}>.`,
            "",
            "────────────────",
            "🔒 Puedes cerrar el ticket cuando tu solicitud haya sido atendida."
          ].join("\n")
        )
        .setTimestamp()
        .setFooter({
          text: "DICA STUDIO • Soporte"
        });

      await ticket.send({
        content:
          `<@${solicitud.userId}> <@&${CONFIG.STAFF_ROLE}>`,
        embeds: [ticketEmbed],
        components: [crearBotonesTicket()],
        allowedMentions: {
          users: [solicitud.userId],
          roles: [CONFIG.STAFF_ROLE]
        }
      });

      // ===============================================
      // NOTIFICACIÓN DE ACEPTADO
      // ===============================================

      const notificacion = guild.channels.cache.get(
        CONFIG.NOTIFICATION_CHANNEL
      );

      if (notificacion && notificacion.isTextBased()) {

        const embedAceptado = new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle("🎫・𝐓𝐈𝐂𝐊𝐄𝐓 𝐀𝐂𝐄𝐏𝐓𝐀𝐃𝐎")
          .setDescription(
            [
              `¡Hola <@${solicitud.userId}>!`,
              "",
              "Tu solicitud de ticket ha sido **aceptada**.",
              "",
              `🎟️ **Ticket:** <#${ticket.id}>`,
              `🛡️ **Aceptado por:** <@${interaction.user.id}>`,
              "",
              "Puedes continuar tu atención dentro del ticket."
            ].join("\n")
          )
          .setTimestamp()
          .setFooter({
            text: "DICA STUDIO • Solicitudes"
          });

        await notificacion.send({
          content: `<@${solicitud.userId}>`,
          embeds: [embedAceptado],
          allowedMentions: {
            users: [solicitud.userId]
          }
        });
      }

      // ===============================================
      // LOG
      // ===============================================

      const logEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("✅ Ticket aceptado")
        .addFields(
          {
            name: "👤 Usuario",
            value: `<@${solicitud.userId}>`,
            inline: true
          },
          {
            name: "🛡️ Staff",
            value: `<@${interaction.user.id}>`,
            inline: true
          },
          {
            name: "🎫 Ticket",
            value: `<#${ticket.id}>`,
            inline: true
          },
          {
            name: "🆔 Solicitud",
            value: `\`${solicitudId}\``,
            inline: false
          }
        )
        .setTimestamp();

      await enviarLog(guild, logEmbed);

      await interaction.update({
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(0x57f287)
            .addFields({
              name: "✅ Estado",
              value: `Aceptada por <@${interaction.user.id}>\n🎫 <#${ticket.id}>`
            })
        ],
        components: []
      });

      return;
    }

    // =================================================
    // RECHAZAR
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("rechazar_")
    ) {

      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo el Staff puede rechazar solicitudes.",
          flags: 64
        });
      }

      const solicitudId = interaction.customId.replace(
        "rechazar_",
        ""
      );

      const solicitud = solicitudes.get(solicitudId);

      if (!solicitud) {
        return interaction.reply({
          content: "❌ Solicitud no encontrada.",
          flags: 64
        });
      }

      if (
        solicitud.estado === "aceptada" ||
        solicitud.estado === "rechazada"
      ) {
        return interaction.reply({
          content: "❌ Esta solicitud ya fue procesada.",
          flags: 64
        });
      }

      solicitud.estado = "rechazada";
      solicitud.rejectedBy = interaction.user.id;

      const guild = interaction.guild;

      const modal = new ModalBuilder()
        .setCustomId(`motivo_rechazo_${solicitudId}`)
        .setTitle("❌ Rechazar solicitud");

      const motivo = new TextInputBuilder()
        .setCustomId("motivo")
        .setLabel("Motivo del rechazo")
        .setPlaceholder("Escribe el motivo...")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(motivo)
      );

      solicitud.rejectionModal = true;

      return interaction.showModal(modal);
    }

    // =================================================
    // MOTIVO DE RECHAZO
    // =================================================

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("motivo_rechazo_")
    ) {

      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo el Staff puede hacer esto.",
          flags: 64
        });
      }

      const solicitudId = interaction.customId.replace(
        "motivo_rechazo_",
        ""
      );

      const solicitud = solicitudes.get(solicitudId);

      if (!solicitud) {
        return interaction.reply({
          content: "❌ Solicitud no encontrada.",
          flags: 64
        });
      }

      const motivo = interaction.fields.getTextInputValue(
        "motivo"
      );

      solicitud.estado = "rechazada";
      solicitud.rejectionReason = motivo;
      solicitud.rejectedBy = interaction.user.id;

      const guild = interaction.guild;

      const notificacion = guild.channels.cache.get(
        CONFIG.NOTIFICATION_CHANNEL
      );

      if (notificacion && notificacion.isTextBased()) {

        const embed = new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle("❌・𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃 𝐑𝐄𝐂𝐇𝐀𝐙𝐀𝐃𝐀")
          .setDescription(
            [
              `Hola <@${solicitud.userId}>.`,
              "",
              "Tu solicitud de ticket ha sido **rechazada**.",
              "",
              `📝 **Motivo:** ${motivo}`,
              "",
              `🛡️ **Staff:** <@${interaction.user.id}>`
            ].join("\n")
          )
          .setTimestamp()
          .setFooter({
            text: "DICA STUDIO • Solicitudes"
          });

        await notificacion.send({
          content: `<@${solicitud.userId}>`,
          embeds: [embed],
          allowedMentions: {
            users: [solicitud.userId]
          }
        });
      }

      const logEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("❌ Solicitud rechazada")
        .addFields(
          {
            name: "👤 Usuario",
            value: `<@${solicitud.userId}>`,
            inline: true
          },
          {
            name: "🛡️ Staff",
            value: `<@${interaction.user.id}>`,
            inline: true
          },
          {
            name: "📝 Motivo",
            value: motivo.substring(0, 1024),
            inline: false
          }
        )
        .setTimestamp();

      await enviarLog(guild, logEmbed);

      await interaction.reply({
        content: "❌ Solicitud rechazada correctamente.",
        flags: 64
      });

      if (interaction.message) {

        await interaction.message.edit({
          embeds: [
            EmbedBuilder.from(interaction.message.embeds[0])
              .setColor(0xed4245)
              .addFields({
                name: "❌ Estado",
                value:
                  `Rechazada por <@${interaction.user.id}>\n` +
                  `**Motivo:** ${motivo}`
              })
          ],
          components: []
        }).catch(() => {});
      }

      return;
    }

    // =================================================
    // AÑADIR USUARIO
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId === "ticket_add"
    ) {

      const ticket = tickets.get(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "❌ Este canal no es un ticket.",
          flags: 64
        });
      }

      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo el Staff puede añadir usuarios.",
          flags: 64
        });
      }

      const modal = new ModalBuilder()
        .setCustomId("ticket_add_modal")
        .setTitle("➕ Añadir usuario");

      const input = new TextInputBuilder()
        .setCustomId("user_id")
        .setLabel("ID del usuario")
        .setPlaceholder("Ejemplo: 123456789012345678")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(17)
        .setMaxLength(20);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return interaction.showModal(modal);
    }

    // =================================================
    // MODAL AÑADIR
    // =================================================

    if (
      interaction.isModalSubmit() &&
      interaction.customId === "ticket_add_modal"
    ) {

      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo el Staff puede añadir usuarios.",
          flags: 64
        });
      }

      const userId = interaction.fields.getTextInputValue(
        "user_id"
      );

      const member = await interaction.guild.members
        .fetch(userId)
        .catch(() => null);

      if (!member) {
        return interaction.reply({
          content: "❌ No encontré ese usuario en el servidor.",
          flags: 64
        });
      }

      await interaction.channel.permissionOverwrites.edit(
        member.id,
        {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true
        }
      );

      await interaction.reply({
        content: `✅ ${member} ha sido añadido al ticket.`,
        flags: 64
      });

      await interaction.channel.send(
        `➕ <@${member.id}> fue añadido al ticket por <@${interaction.user.id}>.`
      );

      return;
    }

    // =================================================
    // CERRAR TICKET
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId === "ticket_close"
    ) {

      const ticket = tickets.get(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "❌ Este canal no es un ticket.",
          flags: 64
        });
      }

      if (
        interaction.user.id !== ticket.userId &&
        !esStaff(interaction.member)
      ) {
        return interaction.reply({
          content: "❌ No puedes cerrar este ticket.",
          flags: 64
        });
      }

      const canal = interaction.channel;
      const nombre = canal.name;

      const logEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("🔒 Ticket cerrado")
        .addFields(
          {
            name: "👤 Usuario",
            value: `<@${ticket.userId}>`,
            inline: true
          },
          {
            name: "👮 Cerrado por",
            value: `<@${interaction.user.id}>`,
            inline: true
          },
          {
            name: "🎫 Canal",
            value: `#${nombre}`,
            inline: true
          },
          {
            name: "🆔 Ticket ID",
            value: `\`${canal.id}\``,
            inline: false
          }
        )
        .setTimestamp();

      await enviarLog(interaction.guild, logEmbed);

      const usuario = await client.users
        .fetch(ticket.userId)
        .catch(() => null);

      if (usuario) {

        const dmEmbed = new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle("🔒・𝐓𝐈𝐂𝐊𝐄𝐓 𝐂𝐄𝐑𝐑𝐀𝐃𝐎")
          .setDescription(
            [
              `Hola ${usuario}.`,
              "",
              "Tu ticket de **DICA STUDIO** ha sido cerrado.",
              "",
              "Si necesitas nuevamente ayuda, puedes abrir una nueva solicitud desde nuestro sistema de tickets.",
              "",
              "🎨 **DICA STUDIO**",
              "Creamos. Diseñamos. Innovamos."
            ].join("\n")
          )
          .setTimestamp();

        await usuario.send({
          embeds: [dmEmbed]
        }).catch(() => {});
      }

      await interaction.reply({
        content: "🔒 Cerrando ticket...",
        flags: 64
      });

      tickets.delete(canal.id);

      setTimeout(async () => {
        await canal.delete(
          "Ticket cerrado"
        ).catch(() => {});
      }, 2500);

      return;
    }

    // =================================================
    // COMANDOS
    // =================================================

    if (!interaction.isChatInputCommand()) {
      return;
    }

    // =================================================
    // BAN
    // =================================================

    if (interaction.commandName === "ban") {

      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.BanMembers
        )
      ) {
        return interaction.reply({
          content: "❌ No tienes permisos para banear.",
          flags: 64
        });
      }

      const usuario = interaction.options.getUser("usuario");
      const razon =
        interaction.options.getString("razon") ||
        "Sin razón especificada";

      const miembro = await interaction.guild.members
        .fetch(usuario.id)
        .catch(() => null);

      if (!miembro) {
        return interaction.reply({
          content: "❌ El usuario no está en el servidor.",
          flags: 64
        });
      }

      await miembro.ban({
        reason: razon
      });

      await interaction.reply(
        `🔨 **${usuario.tag}** fue baneado.\n📝 Razón: ${razon}`
      );

      return;
    }

    // =================================================
    // UNBAN
    // =================================================

    if (interaction.commandName === "unban") {

      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.BanMembers
        )
      ) {
        return interaction.reply({
          content: "❌ No tienes permisos.",
          flags: 64
        });
      }

      const id = interaction.options.getString("id");

      await interaction.guild.members.unban(id);

      return interaction.reply(
        `✅ Usuario \`${id}\` desbaneado.`
      );
    }

    // =================================================
    // KICK
    // =================================================

    if (interaction.commandName === "kick") {

      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.KickMembers
        )
      ) {
        return interaction.reply({
          content: "❌ No tienes permisos.",
          flags: 64
        });
      }

      const usuario = interaction.options.getUser("usuario");
      const razon =
        interaction.options.getString("razon") ||
        "Sin razón especificada";

      const miembro = await interaction.guild.members
        .fetch(usuario.id)
        .catch(() => null);

      if (!miembro) {
        return interaction.reply({
          content: "❌ Usuario no encontrado.",
          flags: 64
        });
      }

      await miembro.kick(razon);

      return interaction.reply(
        `👢 **${usuario.tag}** fue expulsado.\n📝 ${razon}`
      );
    }

    // =================================================
    // TIMEOUT
    // =================================================

    if (interaction.commandName === "timeout") {

      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: "❌ No tienes permisos.",
          flags: 64
        });
      }

      const usuario = interaction.options.getUser("usuario");
      const minutos =
        interaction.options.getInteger("minutos");

      const miembro = await interaction.guild.members
        .fetch(usuario.id)
        .catch(() => null);

      if (!miembro) {
        return interaction.reply({
          content: "❌ Usuario no encontrado.",
          flags: 64
        });
      }

      await miembro.timeout(
        minutos * 60 * 1000,
        `Timeout aplicado por ${interaction.user.tag}`
      );

      return interaction.reply(
        `⏳ <@${usuario.id}> recibió un timeout de **${minutos} minutos**.`
      );
    }

    // =================================================
    // UNTIMEOUT
    // =================================================

    if (interaction.commandName === "untimeout") {

      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: "❌ No tienes permisos.",
          flags: 64
        });
      }

      const usuario = interaction.options.getUser("usuario");

      const miembro = await interaction.guild.members
        .fetch(usuario.id)
        .catch(() => null);

      if (!miembro) {
        return interaction.reply({
          content: "❌ Usuario no encontrado.",
          flags: 64
        });
      }

      await miembro.timeout(null);

      return interaction.reply(
        `✅ Timeout retirado a <@${usuario.id}>.`
      );
    }

    // =================================================
    // WARN
    // =================================================

    if (interaction.commandName === "warn") {

      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: "❌ No tienes permisos.",
          flags: 64
        });
      }

      const usuario = interaction.options.getUser("usuario");
      const razon = interaction.options.getString("razon");

      return interaction.reply(
        `⚠️ <@${usuario.id}> ha recibido una advertencia.\n📝 **Razón:** ${razon}`
      );
    }

    // =================================================
    // CLEAR
    // =================================================

    if (interaction.commandName === "clear") {

      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ManageMessages
        )
      ) {
        return interaction.reply({
          content: "❌ No tienes permisos.",
          flags: 64
        });
      }

      const cantidad =
        interaction.options.getInteger("cantidad");

      await interaction.channel.bulkDelete(
        cantidad,
        true
      );

      return interaction.reply({
        content: `🧹 Eliminados **${cantidad} mensajes**.`,
        flags: 64
      });
    }

    // =================================================
    // USER INFO
    // =================================================

    if (interaction.commandName === "user-info") {

      const usuario =
        interaction.options.getUser("usuario") ||
        interaction.user;

      const miembro = await interaction.guild.members
        .fetch(usuario.id)
        .catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle("👤・Información del usuario")
        .setThumbnail(usuario.displayAvatarURL())
        .addFields(
          {
            name: "👤 Usuario",
            value: `${usuario}`,
            inline: true
          },
          {
            name: "🆔 ID",
            value: `\`${usuario.id}\``,
            inline: true
          },
          {
            name: "🤖 Bot",
            value: usuario.bot ? "Sí" : "No",
            inline: true
          },
          {
            name: "📅 Cuenta creada",
            value: `<t:${Math.floor(
              usuario.createdTimestamp / 1000
            )}:F>`,
            inline: false
          },
          {
            name: "📥 Entrada al servidor",
            value: miembro?.joinedTimestamp
              ? `<t:${Math.floor(
                  miembro.joinedTimestamp / 1000
                )}:F>`
              : "No disponible",
            inline: false
          }
        )
        .setTimestamp();

      return interaction.reply({
        embeds: [embed]
      });
    }

    // =================================================
    // SERVER INFO
    // =================================================

    if (interaction.commandName === "server-info") {

      const guild = interaction.guild;

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle(`🏠・${guild.name}`)
        .setThumbnail(guild.iconURL())
        .addFields(
          {
            name: "🆔 ID",
            value: `\`${guild.id}\``,
            inline: true
          },
          {
            name: "👥 Miembros",
            value: `${guild.memberCount}`,
            inline: true
          },
          {
            name: "📁 Canales",
            value: `${guild.channels.cache.size}`,
            inline: true
          },
          {
            name: "🎭 Roles",
            value: `${guild.roles.cache.size}`,
            inline: true
          }
        )
        .setTimestamp();

      return interaction.reply({
        embeds: [embed]
      });
    }

    // =================================================
    // BOT INFO
    // =================================================

    if (interaction.commandName === "bot-info") {

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle("🤖・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎 𝐁𝐎𝐓")
        .setDescription(
          [
            "🎨 **DICA STUDIO**",
            "",
            "Bot privado para la gestión del sistema de soporte.",
            "",
            `📡 Servidores: ${client.guilds.cache.size}`,
            `⚡ Ping: ${client.ws.ping}ms`,
            `⏱️ Uptime: ${Math.floor(process.uptime())}s`,
            "",
            "🎫 Sistema avanzado de tickets"
          ].join("\n")
        )
        .setTimestamp();

      return interaction.reply({
        embeds: [embed]
      });
    }

    // =================================================
    // AVATAR
    // =================================================

    if (interaction.commandName === "avatar") {

      const usuario =
        interaction.options.getUser("usuario") ||
        interaction.user;

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle(`🖼️・Avatar de ${usuario.username}`)
        .setImage(
          usuario.displayAvatarURL({
            size: 4096,
            extension: "png"
          })
        );

      return interaction.reply({
        embeds: [embed]
      });
    }

    // =================================================
    // PING
    // =================================================

    if (interaction.commandName === "ping") {

      return interaction.reply(
        `🏓 Pong! **${client.ws.ping}ms**`
      );
    }

    // =================================================
    // HELP
    // =================================================

    if (interaction.commandName === "help") {

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle("📚・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎 — 𝐂𝐎𝐌𝐀𝐍𝐃𝐎𝐒")
        .setDescription(
          [
            "🎫 **Tickets**",
            "Sistema de solicitudes y soporte.",
            "",
            "🛡️ **Moderación**",
            "`/ban` `/unban` `/kick`",
            "`/timeout` `/untimeout` `/warn`",
            "`/clear`",
            "",
            "👤 **Información**",
            "`/user-info` `/server-info`",
            "`/avatar` `/bot-info`",
            "",
            "🤖 **Sistema**",
            "`/ping` `/help`"
          ].join("\n")
        )
        .setFooter({
          text: "DICA STUDIO"
        });

      return interaction.reply({
        embeds: [embed]
      });
    }

  } catch (error) {

    console.error("❌ ERROR EN INTERACTION:", error);

    if (!interaction.replied && !interaction.deferred) {

      await interaction.reply({
        content:
          "❌ Ocurrió un error procesando esta interacción.",
        flags: 64
      }).catch(() => {});

    } else {

      await interaction.followUp({
        content:
          "❌ Ocurrió un error procesando esta interacción.",
        flags: 64
      }).catch(() => {});
    }
  }
});

// =====================================================
// LOGIN
// =====================================================

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ Falta DISCORD_TOKEN en .env");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
