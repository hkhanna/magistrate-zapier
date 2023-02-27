const commonInputFields = require("./commonInputFields");

const perform = async (z, bundle) => {
  const response = await z.request({
    method: "POST",
    url:
      "{{process.env.API_DOMAIN}}/v1/envelopes/blueprint/" +
      bundle.inputData.slug +
      "/",

    body: {
      name: bundle.inputData.name, // FIXME
    },
  });
  // this should return a single object
  return response.data;
};


const errorField = (response, key, preface = "") => {
  if (response.data.detail) {
    return [
      {
        key,
        type: "copy",
        helpText: preface + response.data.detail,
      },
    ];
  }
};

const blueprintSlugField = async (z, bundle) => {
  const response = await z.request({
    url: "{{process.env.API_DOMAIN}}/v1/blueprints/official/",
    skipThrowForStatus: true,
  });

  if (response.status >= 400) {
    return errorField(
      response,
      "slug",
      "There was a problem while obtaining the list of blueprints: "
    );
  }

  const data = JSON.parse(response.content);

  return [
    {
      key: "slug",
      label: "Blueprint",
      required: true,
      choices: data,
      altersDynamicFields: true,
    },
  ];
};

const partiesField = async (z, bundle) => {
  if (!bundle.inputData.slug) {
    return [];
  }

  const response = await z.request({
    url:
      "{{process.env.API_DOMAIN}}/v1/blueprints/" + bundle.inputData.slug + "/",
    skipThrowForStatus: true,
  });

  if (response.status >= 400) {
    return errorField(
      response,
      "parties",
      "There was a problem while looking up the selected blueprint: "
    );
  }

  if (response.data.separate_parties) {
    return [commonInputFields.parties];
  }

  return [];
};

const contextField = async (z, bundle) => {
  if (!bundle.inputData.slug) {
    return [
      {
        key: "context",
        type: "copy",
        helpText:
          "You must select a blueprint from the list to set up this integration.",
      },
    ];
  }

  const response = await z.request({
    url:
      "{{process.env.API_DOMAIN}}/v1/blueprints/" +
      bundle.inputData.slug +
      "/?style=zapier",
    skipThrowForStatus: true,
  });

  if (response.status >= 400) {
    return errorField(
      response,
      "context",
      "There was a problem while looking up the selected blueprint: "
    );
  }

  // FIXME - return response.data.context;
  return [];
};

module.exports = {
  key: "blueprint_render",
  noun: "blueprintrender",

  display: {
    label: "Use Blueprint",
    description: "Generate a legal document using a blueprint.",
  },

  operation: {
    perform,

    inputFields: [
      blueprintSlugField,
      commonInputFields.name,
      contextField,
      partiesField,
      commonInputFields.webhook_url,
      commonInputFields.autosign,
      commonInputFields.suppress_emails,
      commonInputFields.action,
    ],

    sample: {
      slug: "official/safe",
      name: "Simple Agreement for Future Equity (SAFE)",
      context: {
        details: {
          purchase_amount: 50000,
          date: "2022-06-01",
          governing_law: "CA",
        },
        company: {
          name: "Magistrate Inc.",
          email: "harry@getmagistrate.com",
          is_entity: true,
          state_of_incorporation: "DE",
          entity_form: "Corporation",
          authorized_human: {
            name: "Harry Khanna",
            title: "Chief Executive Officer",
          },
        },
        investor: {
          name: "Lisa Vedernikova Khanna",
          is_entity: false,
          email: "lisa@getmagistrate.com",
        },
      },
      action: "draft",
    },
  },
};
