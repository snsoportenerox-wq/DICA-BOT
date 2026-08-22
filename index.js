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

// ======================================================
// EXPRESS
// ======================================================

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🟢 DICA BOT ONLINE");
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: client.user ? client.user.tag : "connecting"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Web server iniciado en ${PORT}`);
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
// CONFIGURACIÓN
// ======================================================

const CONFIG = {
  PANEL_CHANNEL: "1514355453742551102",

  LOG_CHANNEL: "1539791936058163241",

  REQUEST_CHANNEL: "1540814503607009330",

  NOTIFICATION_CHANNEL: "1540814776878374943",

  TICKET_CATEGORY: "1514355351712043141",

  STAFF_ROLE: "1540815218689441812"
};

// ======================================================
// CATEGORÍAS
// ======================================================

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
        value: "otro",
        label: "Otro reporte",
        emoji: "📋",
        description: "Realizar otro reporte"
      }
    ],

    questions: [
      {
        id: "persona",
        label: "¿A quién reportas?",
        style: TextInputStyle.Short
      },
      {
        id: "motivo",
        label: "¿Cuál es el motivo?",
        style: TextInputStyle.Paragraph
      },
      {
        id: "pruebas",
        label: "¿Cuáles son las pruebas?",
        style: TextInputStyle.Paragraph
      },
      {
        id: "fecha",
        label: "¿Cuándo ocurrió?",
        style: TextInputStyle.Short
      }
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
        value: "colaboracion",
        label: "Colaboración",
        emoji: "✨",
        description: "Proponer una colaboración"
      }
    ],

    questions: [
      {
        id: "servidor",
        label: "Nombre del servidor",
        style: TextInputStyle.Short
      },
      {
        id: "invitacion",
        label: "Link de invitación",
        style: TextInputStyle.Short
      },
      {
        id: "miembros",
        label: "Cantidad de miembros",
        style: TextInputStyle.Short
      },
      {
        id: "propuesta",
        label: "Describe tu propuesta",
        style: TextInputStyle.Paragraph
      }
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
        description: "Problema con un bot"
      }
    ],

    questions: [
      {
        id: "asunto",
        label: "¿Cuál es el asunto?",
        style: TextInputStyle.Short
      },
      {
        id: "descripcion",
        label: "Describe tu problema",
        style: TextInputStyle.Paragraph
      },
      {
        id: "pruebas",
        label: "¿Tienes pruebas?",
        style: TextInputStyle.Paragraph
      },
      {
        id: "extra",
        label: "Información adicional",
        style: TextInputStyle.Paragraph
      }
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
        value: "desarrollador",
        label: "Desarrollador",
        emoji: "💻",
        description: "Postularte como desarrollador"
      }
    ],

    questions: [
      {
        id: "edad",
        label: "¿Cuál es tu edad?",
        style: TextInputStyle.Short
      },
      {
        id: "experiencia",
        label: "¿Qué experiencia tienes?",
        style: TextInputStyle.Paragraph
      },
      {
        id: "motivo",
        label: "¿Por qué quieres postularte?",
        style: TextInputStyle.Paragraph
      },
      {
        id: "horario",
        label: "¿Cuánto tiempo tienes disponible?",
        style: TextInputStyle.Short
      }
    ]
  }
};

// ======================================================
// MEMORIA
// ======================================================

const solicitudes = new Map();
const tickets = new Map();

// ======================================================
// FUNCIONES
// ======================================================

function esStaff(member) {
  if (!member) return false;

  return (
    member.roles.cache.has(CONFIG.STAFF_ROLE) ||
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.permissions.has(PermissionsBitField.Flags.ManageChannels)
  );
}

function menuPrincipal() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_categoria")
    .setPlaceholder("🎫・Selecciona una categoría")
    .addOptions(
      Object.entries(CATEGORIES).map(([id, data]) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(data.name)
          .setValue(id)
          .setEmoji(data.emoji)
          .setDescription(`Abrir una solicitud de ${data.name}`);
      })
    );

  return new ActionRowBuilder().addComponents(menu);
}

function menuSubcategoria(categoria) {
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

function botonesSolicitud(id) {
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

function botonesTicket() {
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

async function enviarLog(guild, embed) {
  const channel = guild.channels.cache.get(CONFIG.LOG_CHANNEL);

  if (!channel || !channel.isTextBased()) return;

  await channel.send({
    embeds: [embed]
  }).catch(console.error);
}

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {
  console.log(`🟢 Conectado como ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Muestra la latencia del bot"),

    new SlashCommandBuilder()
      .setName("bot-info")
      .setDescription("Información del bot"),

    new SlashCommandBuilder()
      .setName("server-info")
      .setDescription("Información del servidor"),

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
      .setName("avatar")
      .setDescription("Muestra el avatar")
      .addUserOption(option =>
        option
          .setName("usuario")
          .setDescription("Usuario")
          .setRequired(false)
      ),

    new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Banea un usuario")
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
      .setName("kick")
      .setDescription("Expulsa un usuario")
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
      .setDescription("Desbanea por ID")
      .addStringOption(option =>
        option
          .setName("id")
          .setDescription("ID del usuario")
          .setRequired(true)
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
          .setDescription("Minutos")
          .setMinValue(1)
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
      .setDescription("Advierte un usuario")
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
          .setDescription("Cantidad")
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("help")
      .setDescription("Lista de comandos")
  ];

  try {
    const rest = new REST({ version: "10" })
      .setToken(process.env.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: commands.map(command => command.toJSON())
      }
    );

    console.log("✅ Comandos registrados.");
  } catch (error) {
    console.error("❌ Error registrando comandos:", error);
  }

  await enviarPanel();
});

// ======================================================
// ENVIAR PANEL
// ======================================================

async function enviarPanel() {
  const channel = await client.channels
    .fetch(CONFIG.PANEL_CHANNEL)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) {
    console.log("❌ Canal del panel inválido.");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle("🎫・𝐃𝐈𝐂𝐀 𝐒𝐓𝐔𝐃𝐈𝐎 — 𝐓𝐈𝐂𝐊𝐄𝐓𝐒")
    .setDescription(
      [
        "╭────────────────────╮",
        "      🎨 **DICA STUDIO**",
        "╰────────────────────╯",
        "",
        "Bienvenido al sistema oficial de soporte.",
        "",
        "Selecciona una categoría en el menú para comenzar.",
        "",
        "🚨 **Reporte**",
        "Reporta usuarios, Staff u otros problemas.",
        "",
        "🤝 **Alianza**",
        "Solicita alianzas y colaboraciones.",
        "",
        "🛠️ **Soporte General**",
        "Obtén ayuda con cualquier problema.",
        "",
        "📋 **Postulación**",
        "Postúlate para formar parte del equipo.",
        "",
        "────────────────────",
        "",
        "📝 Primero tendrás que responder unas preguntas.",
        "📨 Tu solicitud será enviada al canal correspondiente.",
        "🛡️ Un Staff deberá aceptarla.",
        "🎫 Solo después de ser aceptada se creará el ticket.",
        "",
        "✨ Gracias por confiar en DICA STUDIO."
      ].join("\n")
    )
    .setFooter({
      text: "DICA STUDIO • Sistema de tickets"
    })
    .setTimestamp();

  await channel.send({
    embeds: [embed],
    components: [menuPrincipal()]
  });

  console.log("🎫 Panel enviado.");
}

// ======================================================
// INTERACTIONS
// ======================================================

client.on("interactionCreate", async interaction => {
  try {

    // ==================================================
    // CATEGORÍA PRINCIPAL
    // ==================================================

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
            "Selecciona una opción:",
            "",
            "📝 Después aparecerá un formulario.",
            "📨 La solicitud será enviada al Staff."
          ].join("\n")
        );

      return interaction.reply({
        embeds: [embed],
        components: [menuSubcategoria(categoria)],
        flags: 64
      });
    }

    // ==================================================
    // SUBCATEGORÍA
    // ==================================================

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
        .setCustomId(`form_${categoria}_${opcion}`)
        .setTitle(`${data.emoji} ${data.name}`);

      for (const question of data.questions) {
        const input = new TextInputBuilder()
          .setCustomId(question.id)
          .setLabel(question.label.substring(0, 45))
          .setStyle(question.style)
          .setRequired(true);

        if (question.style === TextInputStyle.Short) {
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

    // ==================================================
    // FORMULARIO
    // ==================================================

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("form_")
    ) {
      const parts = interaction.customId.split("_");

      const categoria = parts[1];
      const opcion = parts.slice(2).join("_");

      const data = CATEGORIES[categoria];

      if (!data) {
        return interaction.reply({
          content: "❌ Categoría inválida.",
          flags: 64
        });
      }

      const respuestas = {};

      for (const question of data.questions) {
        respuestas[question.id] =
          interaction.fields.getTextInputValue(question.id);
      }

      const id = `${interaction.user.id}-${Date.now()}`;

      solicitudes.set(id, {
        id,
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        categoria,
        opcion,
        respuestas,
        estado: "pendiente",
        staffId: null
      });

      const requestChannel = await client.channels
        .fetch(CONFIG.REQUEST_CHANNEL)
        .catch(() => null);

      if (!requestChannel || !requestChannel.isTextBased()) {
        return interaction.reply({
          content: "❌ No se encontró el canal de solicitudes.",
          flags: 64
        });
      }

      const fields = data.questions.map(question => {
        return {
          name: question.label,
          value:
            respuestas[question.id]?.substring(0, 1024) ||
            "Sin respuesta",
          inline: false
        };
      });

      const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle(`${data.emoji}・Nueva solicitud`)
        .setDescription(
          [
            `👤 **Usuario:** <@${interaction.user.id}>`,
            `🆔 **ID:** \`${interaction.user.id}\``,
            `📂 **Categoría:** ${data.name}`,
            `🔹 **Opción:** ${opcion}`,
            "",
            "🛡️ Un Staff debe reclamar esta solicitud.",
            "⚠️ Todavía **NO se ha creado ningún ticket**."
          ].join("\n")
        )
        .addFields(fields)
        .setTimestamp()
        .setFooter({
          text: `Solicitud ${id}`
        });

      const message = await requestChannel.send({
        content: `<@&${CONFIG.STAFF_ROLE}>`,
        embeds: [embed],
        components: [botonesSolicitud(id)],
        allowedMentions: {
          roles: [CONFIG.STAFF_ROLE]
        }
      });

      solicitudes.get(id).messageId = message.id;

      await interaction.reply({
        content:
          "✅ **Solicitud enviada.**\n\n" +
          "El Staff la revisará primero. " +
          "Si es aceptada, se creará automáticamente tu ticket.",
        flags: 64
      });

      return;
    }

    // ==================================================
    // RECLAMAR
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("reclamar_")
    ) {
      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo Staff.",
          flags: 64
        });
      }

      const id = interaction.customId.replace(
        "reclamar_",
        ""
      );

      const solicitud = solicitudes.get(id);

      if (!solicitud) {
        return interaction.reply({
          content: "❌ Solicitud no encontrada.",
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

      const embed = EmbedBuilder.from(
        interaction.message.embeds[0]
      )
        .setColor(0xf1c40f)
        .addFields({
          name: "🙋 Staff encargado",
          value: `<@${interaction.user.id}>`
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`reclamar_${id}`)
          .setLabel("Reclamada")
          .setEmoji("🙋")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),

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

      return interaction.update({
        embeds: [embed],
        components: [row]
      });
    }

    // ==================================================
    // ACEPTAR
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("aceptar_")
    ) {
      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo Staff.",
          flags: 64
        });
      }

      const id = interaction.customId.replace(
        "aceptar_",
        ""
      );

      const solicitud = solicitudes.get(id);

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

      // -----------------------------------------------
      // COMPROBAR CATEGORÍA
      // -----------------------------------------------

      const category = interaction.guild.channels.cache.get(
        CONFIG.TICKET_CATEGORY
      );

      if (!category) {
        return interaction.reply({
          content:
            `❌ No existe la categoría \`${CONFIG.TICKET_CATEGORY}\`.`,
          flags: 64
        });
      }

      if (category.type !== ChannelType.GuildCategory) {
        return interaction.reply({
          content:
            `❌ \`${CONFIG.TICKET_CATEGORY}\` existe, pero NO es una categoría de Discord.\n\n` +
            "Debes colocar el ID de la categoría donde quieres crear los tickets.",
          flags: 64
        });
      }

      // -----------------------------------------------
      // USUARIO
      // -----------------------------------------------

      const user = await client.users
        .fetch(solicitud.userId)
        .catch(() => null);

      if (!user) {
        return interaction.reply({
          content: "❌ No se encontró el usuario.",
          flags: 64
        });
      }

      const username = user.username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 15) || "usuario";

      // -----------------------------------------------
      // CREAR TICKET
      // -----------------------------------------------

      const ticket = await interaction.guild.channels.create({
        name: `ticket-${username}`,
        type: ChannelType.GuildText,
        parent: category.id,
        topic: `ticket:${id}`,

        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
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
        userId: solicitud.userId,
        staffId:
          solicitud.staffId || interaction.user.id,
        solicitudId: id
      });

      const data = CATEGORIES[solicitud.categoria];

      // -----------------------------------------------
      // MENSAJE DENTRO DEL TICKET
      // -----------------------------------------------

      const ticketEmbed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle("🎫・𝐓𝐈𝐂𝐊𝐄𝐓 𝐀𝐁𝐈𝐄𝐑𝐓𝐎")
        .setDescription(
          [
            `👋 Bienvenido <@${solicitud.userId}>.`,
            "",
            `📂 **Categoría:** ${data.name}`,
            `🔹 **Solicitud:** ${solicitud.opcion}`,
            "",
            "🛡️ Un miembro del Staff te atenderá.",
            "",
            "Puedes utilizar los botones de abajo:",
            "➕ **Añadir** — Añadir una persona al ticket.",
            "🔒 **Cerrar** — Cerrar el ticket."
          ].join("\n")
        )
        .setFooter({
          text: "DICA STUDIO • Sistema de tickets"
        })
        .setTimestamp();

      await ticket.send({
        content:
          `<@${solicitud.userId}> <@&${CONFIG.STAFF_ROLE}>`,
        embeds: [ticketEmbed],
        components: [botonesTicket()],
        allowedMentions: {
          users: [solicitud.userId],
          roles: [CONFIG.STAFF_ROLE]
        }
      });

      // -----------------------------------------------
      // NOTIFICACIÓN ACEPTADO
      // -----------------------------------------------

      const notificationChannel =
        interaction.guild.channels.cache.get(
          CONFIG.NOTIFICATION_CHANNEL
        );

      if (
        notificationChannel &&
        notificationChannel.isTextBased()
      ) {
        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle("✅・𝐓𝐈𝐂𝐊𝐄𝐓 𝐀𝐂𝐄𝐏𝐓𝐀𝐃𝐎")
          .setDescription(
            [
              `¡Hola <@${solicitud.userId}>!`,
              "",
              "Tu solicitud ha sido **aceptada**.",
              "",
              `🎫 **Tu ticket:** <#${ticket.id}>`,
              "",
              `🛡️ **Aceptado por:** <@${interaction.user.id}>`,
              "",
              "Ya puedes entrar al ticket y recibir atención."
            ].join("\n")
          )
          .setTimestamp();

        await notificationChannel.send({
          content: `<@${solicitud.userId}>`,
          embeds: [embed],
          allowedMentions: {
            users: [solicitud.userId]
          }
        });
      }

      // -----------------------------------------------
      // LOG
      // -----------------------------------------------

      await enviarLog(
        interaction.guild,
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle("🎫 Ticket creado")
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
            }
          )
          .setTimestamp()
      );

      // -----------------------------------------------
      // ACTUALIZAR SOLICITUD
      // -----------------------------------------------

      const solicitudEmbed = EmbedBuilder.from(
        interaction.message.embeds[0]
      )
        .setColor(0x57f287)
        .addFields({
          name: "✅ Estado",
          value:
            `Aceptada por <@${interaction.user.id}>\n` +
            `🎫 Ticket: <#${ticket.id}>`
        });

      return interaction.update({
        embeds: [solicitudEmbed],
        components: []
      });
    }

    // ==================================================
    // RECHAZAR
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("rechazar_")
    ) {
      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo Staff.",
          flags: 64
        });
      }

      const id = interaction.customId.replace(
        "rechazar_",
        ""
      );

      const solicitud = solicitudes.get(id);

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
          content: "❌ Ya fue procesada.",
          flags: 64
        });
      }

      const modal = new ModalBuilder()
        .setCustomId(`rechazo_${id}`)
        .setTitle("❌ Rechazar solicitud");

      const input = new TextInputBuilder()
        .setCustomId("motivo")
        .setLabel("Motivo del rechazo")
        .setPlaceholder("Escribe el motivo...")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return interaction.showModal(modal);
    }

    // ==================================================
    // MODAL RECHAZO
    // ==================================================

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("rechazo_")
    ) {
      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo Staff.",
          flags: 64
        });
      }

      const id = interaction.customId.replace(
        "rechazo_",
        ""
      );

      const solicitud = solicitudes.get(id);

      if (!solicitud) {
        return interaction.reply({
          content: "❌ Solicitud no encontrada.",
          flags: 64
        });
      }

      const motivo =
        interaction.fields.getTextInputValue("motivo");

      solicitud.estado = "rechazada";
      solicitud.rejectedBy = interaction.user.id;
      solicitud.reason = motivo;

      const notificationChannel =
        interaction.guild.channels.cache.get(
          CONFIG.NOTIFICATION_CHANNEL
        );

      if (
        notificationChannel &&
        notificationChannel.isTextBased()
      ) {
        const embed = new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle("❌・𝐒𝐎𝐋𝐈𝐂𝐈𝐓𝐔𝐃 𝐑𝐄𝐂𝐇𝐀𝐙𝐀𝐃𝐀")
          .setDescription(
            [
              `Hola <@${solicitud.userId}>.`,
              "",
              "Tu solicitud ha sido **rechazada**.",
              "",
              `📝 **Motivo:** ${motivo}`,
              "",
              `🛡️ **Staff:** <@${interaction.user.id}>`
            ].join("\n")
          )
          .setTimestamp();

        await notificationChannel.send({
          content: `<@${solicitud.userId}>`,
          embeds: [embed],
          allowedMentions: {
            users: [solicitud.userId]
          }
        });
      }

      await enviarLog(
        interaction.guild,
        new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle("❌ Solicitud rechazada")
          .addFields(
            {
              name: "👤 Usuario",
              value: `<@${solicitud.userId}>`
            },
            {
              name: "🛡️ Staff",
              value: `<@${interaction.user.id}>`
            },
            {
              name: "📝 Motivo",
              value: motivo.substring(0, 1024)
            }
          )
          .setTimestamp()
      );

      await interaction.reply({
        content: "❌ Solicitud rechazada.",
        flags: 64
      });

      await interaction.message.edit({
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(0xed4245)
            .addFields({
              name: "❌ Estado",
              value:
                `Rechazada por <@${interaction.user.id}>\n` +
                `📝 ${motivo}`
            })
        ],
        components: []
      }).catch(() => {});

      return;
    }

    // ==================================================
    // AÑADIR
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === "ticket_add"
    ) {
      const ticket = tickets.get(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "❌ Este no es un ticket.",
          flags: 64
        });
      }

      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo Staff.",
          flags: 64
        });
      }

      const modal = new ModalBuilder()
        .setCustomId("add_user")
        .setTitle("➕ Añadir usuario");

      const input = new TextInputBuilder()
        .setCustomId("user_id")
        .setLabel("ID del usuario")
        .setPlaceholder("123456789012345678")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input)
      );

      return interaction.showModal(modal);
    }

    // ==================================================
    // MODAL AÑADIR
    // ==================================================

    if (
      interaction.isModalSubmit() &&
      interaction.customId === "add_user"
    ) {
      if (!esStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Solo Staff.",
          flags: 64
        });
      }

      const userId =
        interaction.fields.getTextInputValue("user_id");

      const member = await interaction.guild.members
        .fetch(userId)
        .catch(() => null);

      if (!member) {
        return interaction.reply({
          content: "❌ Usuario no encontrado en el servidor.",
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
        content: `✅ ${member} fue añadido al ticket.`,
        flags: 64
      });

      await interaction.channel.send(
        `➕ <@${member.id}> fue añadido por <@${interaction.user.id}>.`
      );

      return;
    }

    // ==================================================
    // CERRAR
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === "ticket_close"
    ) {
      const ticket = tickets.get(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({
          content: "❌ Este no es un ticket.",
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

      const channel = interaction.channel;

      await enviarLog(
        interaction.guild,
        new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle("🔒 Ticket cerrado")
          .addFields(
            {
              name: "👤 Usuario",
              value: `<@${ticket.userId}>`,
              inline: true
            },
            {
              name: "🔒 Cerrado por",
              value: `<@${interaction.user.id}>`,
              inline: true
            },
            {
              name: "🎫 Canal",
              value: `#${channel.name}`,
              inline: true
            }
          )
          .setTimestamp()
      );

      const user = await client.users
        .fetch(ticket.userId)
        .catch(() => null);

      if (user) {
        await user.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xed4245)
              .setTitle("🔒・𝐓𝐈𝐂𝐊𝐄𝐓 𝐂𝐄𝐑𝐑𝐀𝐃𝐎")
              .setDescription(
                [
                  "Tu ticket de DICA STUDIO ha sido cerrado.",
                  "",
                  "Si necesitas ayuda nuevamente, puedes crear una nueva solicitud."
                ].join("\n")
              )
              .setTimestamp()
          ]
        }).catch(() => {});
      }

      await interaction.reply({
        content: "🔒 Ticket cerrado. Eliminando canal...",
        flags: 64
      });

      tickets.delete(channel.id);

      setTimeout(() => {
        channel.delete("Ticket cerrado").catch(() => {});
      }, 2000);

      return;
    }

    // ==================================================
    // COMANDOS
    // ==================================================

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "ping") {
      return interaction.reply(
        `🏓 Pong! **${client.ws.ping}ms**`
      );
    }

    if (interaction.commandName === "bot-info") {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle("🤖・DICA BOT")
            .setDescription(
              [
                "🎫 Sistema de tickets",
                "🛡️ Sistema de Staff",
                "📨 Sistema de solicitudes",
                "",
                `📡 Servidores: ${client.guilds.cache.size}`,
                `🏓 Ping: ${client.ws.ping}ms`
              ].join("\n")
            )
        ]
      });
    }

    if (interaction.commandName === "server-info") {
      const guild = interaction.guild;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle(`🏠・${guild.name}`)
            .setThumbnail(guild.iconURL())
            .addFields(
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
                name: "📁 Canales",
                value: `${guild.channels.cache.size}`,
                inline: true
              }
            )
        ]
      });
    }

    if (interaction.commandName === "user-info") {
      const user =
        interaction.options.getUser("usuario") ||
        interaction.user;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle("👤・Información")
            .setThumbnail(user.displayAvatarURL())
            .addFields(
              {
                name: "Usuario",
                value: `${user}`,
                inline: true
              },
              {
                name: "ID",
                value: `\`${user.id}\``,
                inline: true
              },
              {
                name: "Bot",
                value: user.bot ? "Sí" : "No",
                inline: true
              }
            )
        ]
      });
    }

    if (interaction.commandName === "avatar") {
      const user =
        interaction.options.getUser("usuario") ||
        interaction.user;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle(`🖼️・${user.username}`)
            .setImage(
              user.displayAvatarURL({
                size: 4096
              })
            )
        ]
      });
    }

    // ==================================================
    // MODERACIÓN
    // ==================================================

    if (interaction.commandName === "ban") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.BanMembers
        )
      ) {
        return interaction.reply({
          content: "❌ Sin permisos.",
          flags: 64
        });
      }

      const user = interaction.options.getUser("usuario");
      const reason =
        interaction.options.getString("razon") ||
        "Sin razón";

      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member) {
        return interaction.reply({
          content: "❌ Usuario no encontrado.",
          flags: 64
        });
      }

      await member.ban({
        reason
      });

      return interaction.reply(
        `🔨 ${user} fue baneado.\n📝 ${reason}`
      );
    }

    if (interaction.commandName === "kick") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.KickMembers
        )
      ) {
        return interaction.reply({
          content: "❌ Sin permisos.",
          flags: 64
        });
      }

      const user = interaction.options.getUser("usuario");
      const reason =
        interaction.options.getString("razon") ||
        "Sin razón";

      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member) {
        return interaction.reply({
          content: "❌ Usuario no encontrado.",
          flags: 64
        });
      }

      await member.kick(reason);

      return interaction.reply(
        `👢 ${user} fue expulsado.\n📝 ${reason}`
      );
    }

    if (interaction.commandName === "unban") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.BanMembers
        )
      ) {
        return interaction.reply({
          content: "❌ Sin permisos.",
          flags: 64
        });
      }

      const id = interaction.options.getString("id");

      await interaction.guild.members.unban(id);

      return interaction.reply(
        `✅ \`${id}\` fue desbaneado.`
      );
    }

    if (interaction.commandName === "timeout") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: "❌ Sin permisos.",
          flags: 64
        });
      }

      const user = interaction.options.getUser("usuario");
      const minutes =
        interaction.options.getInteger("minutos");

      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member) {
        return interaction.reply({
          content: "❌ Usuario no encontrado.",
          flags: 64
        });
      }

      await member.timeout(
        minutes * 60 * 1000,
        `Aplicado por ${interaction.user.tag}`
      );

      return interaction.reply(
        `⏳ ${user} recibió timeout por **${minutes} minutos**.`
      );
    }

    if (interaction.commandName === "untimeout") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: "❌ Sin permisos.",
          flags: 64
        });
      }

      const user = interaction.options.getUser("usuario");

      const member = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member) {
        return interaction.reply({
          content: "❌ Usuario no encontrado.",
          flags: 64
        });
      }

      await member.timeout(null);

      return interaction.reply(
        `✅ Timeout retirado a ${user}.`
      );
    }

    if (interaction.commandName === "warn") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ModerateMembers
        )
      ) {
        return interaction.reply({
          content: "❌ Sin permisos.",
          flags: 64
        });
      }

      const user = interaction.options.getUser("usuario");
      const reason =
        interaction.options.getString("razon");

      return interaction.reply(
        `⚠️ ${user} recibió una advertencia.\n📝 ${reason}`
      );
    }

    if (interaction.commandName === "clear") {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.ManageMessages
        )
      ) {
        return interaction.reply({
          content: "❌ Sin permisos.",
          flags: 64
        });
      }

      const amount =
        interaction.options.getInteger("cantidad");

      await interaction.channel.bulkDelete(
        amount,
        true
      );

      return interaction.reply({
        content: `🧹 Eliminados ${amount} mensajes.`,
        flags: 64
      });
    }

    if (interaction.commandName === "help") {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle("📚・𝐂𝐎𝐌𝐀𝐍𝐃𝐎𝐒")
            .setDescription(
              [
                "🎫 **Tickets**",
                "Sistema mediante panel.",
                "",
                "🛡️ **Moderación**",
                "`/ban` `/kick` `/unban`",
                "`/timeout` `/untimeout` `/warn` `/clear`",
                "",
                "👤 **Información**",
                "`/user-info` `/server-info` `/avatar`",
                "",
                "🤖 **Bot**",
                "`/bot-info` `/ping` `/help`"
              ].join("\n")
            )
        ]
      });
    }

  } catch (error) {
    console.error("❌ ERROR:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Ocurrió un error.",
        flags: 64
      }).catch(() => {});
    }
  }
});

// ======================================================
// LOGIN
// ======================================================

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ Falta DISCORD_TOKEN.");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
