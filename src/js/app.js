App = {
  web3Provider: null,
  contracts: {},

  init: () => {
    // Load pets.
    $.getJSON('../pets.json', data => {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      data.map(item => {
        petTemplate.find('.panel-title').text(item.name);
        petTemplate.find('img').attr('src', item.picture);
        petTemplate.find('.pet-breed').text(item.breed);
        petTemplate.find('.pet-age').text(item.age);
        petTemplate.find('.pet-location').text(item.location);
        petTemplate.find('.btn-adopt').attr('data-id', item.id);
        petsRow.append(petTemplate.html());
      });
    });

    return App.initWeb3();
  },

  initWeb3: () => {
    // check Web3 instance active
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: () => {

    $.getJSON('Adoption.json', data => {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      // Set the provider for out contract
      App.contracts.Adoption.setProvider(App.web3Provider);
      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: () => {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: (adopters, account) => {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(instance => {
      adoptionInstance = instance;
      return adoptionInstance.getAdopters.call();
    }).then(adopters => {
      adopters.map((adopter, i) => {
        if (adopter !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      });
    }).catch(err => {
      console.log(err.message);
    })
  },

  handleAdopt: event => {
    event.preventDefault();
    var petId = parseInt($(event.target).data('id'));
    var adoptionInstance;

    web3.eth.getAccounts((error, accounts) => {
      error && console.log(error);
      var account = accounts[0];

      App.contracts.Adoption.deployed().then(instance => {
        adoptionInstance = instance;
        return adoptionInstance.adopt(petId, { from: account });
      }).then(result => {
        return App.markAdopted();
      }).catch(err => {
        console.log(err.message);
      })
    })
  }

};

$(() => {
  $(window).load(() => {
    App.init();
  });
});
