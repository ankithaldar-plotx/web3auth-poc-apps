/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { ADAPTER_EVENTS, WALLET_ADAPTERS } from "@web3auth/base";
import { OpenloginAdapter, } from "@web3auth/openlogin-adapter";
// import { Web3Auth, } from "@web3auth/web3auth";
import { Web3AuthCore } from "@web3auth/core";

import { CHAIN_CONFIG, CHAIN_CONFIG_TYPE } from "../../config/chains";
import { WEB3AUTH_NETWORK_TYPE } from "../../config/web3auth-networks";
import { HttpClient } from '@angular/common/http';
import { getWalletProvider, IWalletProvider } from "../../services/wallet-provider";

const clientId = "BDvpk2BAy4ltinXXJHWpa-psY9IkIfb3fQYxbVRDuYy92eeUMth5-2S_SrFac8ohk5r-KioqCI2_A7L4vOW-gEI";
// const idToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYW5raXRoYWxkYXIiLCJlbWFpbCI6ImFua2l0QGdtYWlsLmNvbSIsImF1ZCI6InVybjpteS1yZXNvdXJjZS1zZXJ2ZXIiLCJpc3MiOiJodHRwczovL215LWF1dGh6LXNlcnZlciIsInN1YiI6InRlc3QiLCJraWQiOiJ0ZXN0MTIzMTIzMTIzIiwiaWF0IjoxNjYwNjY2MzIxfQ.oxCbYXODzRIB4H_zxxSsBvEuqCnZeKpAyLTHOXXaasHm6QN2im1eN7fqzOLk-BSR0pMWRWp9GKohcYxIPo68cg"


@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.css"],
})
export class MainComponent implements OnChanges {
  @Input() chain: CHAIN_CONFIG_TYPE = "polygon";

  @Input() network: WEB3AUTH_NETWORK_TYPE = "testnet";

  @Output() loginStatusEvent = new EventEmitter<boolean>();

  web3auth: Web3AuthCore | null = null;

  isLoggedIn = false;

  isModalLoaded = true;

  provider: IWalletProvider | null = null;

  constructor(private http: HttpClient) {
  }


  setLoginStatus(status: boolean): void {
    this.isLoggedIn = status;
    this.loginStatusEvent.emit(status);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // eslint-disable-next-line dot-notation
    if (!changes["chain"] && !changes["network"]) {
      return;
    }

    console.log("CHANGING CHAIN");

    const subscribeAuthEvents = (web3auth: Web3AuthCore) => {
      web3auth.on(ADAPTER_EVENTS.CONNECTED, (data) => {
        console.log("Yeah!, you are successfully logged in", data);
        this.setLoginStatus(true);
      });

      web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
        console.log("connecting");
      });

      web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
        console.log("disconnected");
        this.setLoginStatus(false);
      });

      web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
        console.log("some error or user have cancelled login request", error);
      });
    };

    const initializeModal = async () => {
      console.log("INIT MODAL");
      this.web3auth = new Web3AuthCore({
        // clientId,
        enableLogging: true,
        chainConfig: CHAIN_CONFIG[this.chain],
      });
      const adapter = new OpenloginAdapter({
        adapterSettings: {
          network: this.network, clientId,
          uxMode: "redirect",
          loginConfig: {
            "jwt": {

              name: "Name of your choice",
              verifier: "test-jwt-plotx-01",
              typeOfLogin: "jwt",
              clientId: clientId
              // clientId: "YOUR-CLIENTID-FROM-SOCIAL-PROVIDER",
            }
          }
        },
        loginSettings: { loginProvider: "jwt", curve: "ed25519", },
        // jwtParameters: {}

      });
      this.web3auth.configureAdapter(adapter);

      subscribeAuthEvents(this.web3auth);
      await this.web3auth.init();
      this.isModalLoaded = true;

      // if (this.isLoggedIn && !this.provider) {
      //   const web3authProvider = await this.web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      //     loginProvider: "jwt",
      //     extraLoginOptions: {
      //       domain: "https://my-authz-server",
      //       verifierIdField: "email",
      //       id_token: idToken,
      //     },
      //   });
      //   if (web3authProvider) this.provider = getWalletProvider(this.chain, web3authProvider, this.uiConsole);
      // }
    };
    initializeModal();
  }
  async submitForm() {
    // console.log(this.form.getRawValue());
    // const payload = this.form.getRawValue();
    const url = 'https://3ari1vrpu7.execute-api.ap-southeast-2.amazonaws.com/dev/api/user/generateToken'; // Replace it with your own API path
    this.http.post(url, {
      "username": "user2",
      "password": "user2"
    })
      .subscribe((res: any) => {
        this.login(res.token)
        // If you wish to return the body of response only
        return res;
      });

  }

  async login(idToken: string) {
    console.log("LOGGING IN");
    if (!this.web3auth) {
      console.log("Web3auth is not initialized");
      return;
    }
    const web3authProvider = await this.web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: "jwt",
      extraLoginOptions: {
        domain: "https://my-authz-server",
        verifierIdField: "email",
        id_token: idToken,
      },
    });
    if (web3authProvider) this.provider = getWalletProvider(this.chain, web3authProvider, this.uiConsole);
    // const web3authProvider = await this.web3auth.connectTo("openlogin", { token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYW5raXRoYWxkYXIiLCJlbWFpbCI6ImFua2l0QGdtYWlsLmNvbSIsImF1ZCI6InVybjpteS1yZXNvdXJjZS1zZXJ2ZXIiLCJpc3MiOiJodHRwczovL215LWF1dGh6LXNlcnZlciIsInN1YiI6InRlc3QiLCJpYXQiOjE2NTkxOTgxNTB9.wEjj39N35V6PI7_nWLXr1ZBNeVIgy26y0zwR4k7NaWCYkQXq4aLuGgpY732Zh3-w2J6Bs3EDAnOQTrykzAE4eQ" });


  }

  async logout() {
    console.log("LOGGING OUT");
    if (!this.web3auth) {
      console.log("Web3auth is not initialized");
      return;
    }
    await this.web3auth.logout();
    this.provider = null;
  }

  async getUserInfo() {
    console.log("GETTING USER INFO");
    if (!this.web3auth) {
      console.log("Web3auth is not initialized");
      return;
    }
    const userInfo = await this.web3auth.getUserInfo();
    this.uiConsole("User Info", userInfo);
  }

  async getBalance() {
    console.log("GETTING ACCOUNT BALANCE");
    if (!this.provider) {
      this.uiConsole("provider is not initialized");
      return;
    }
    await this.provider.getBalance();
  }

  async getAccount() {
    console.log("GETTING ACCOUNT");
    if (!this.provider) {
      this.uiConsole("provider is not initialized");
      return;
    }
    await this.provider.getAccounts();
  }

  async signMessage() {
    console.log("SIGNING MESSAGE");
    if (!this.provider) {
      this.uiConsole("provider is not initialized");
      return;
    }
    await this.provider.signMessage();
  }

  async signTransaction() {
    console.log("SIGNING MESSAGE");
    if (!this.provider) {
      this.uiConsole("provider is not initialized");
      return;
    }
    await this.provider.signTransaction();
  }

  async signAndSendTransaction() {
    console.log("SIGNING MESSAGE");
    if (!this.provider) {
      this.uiConsole("provider is not initialized");
      return;
    }
    await this.provider.signAndSendTransaction();
  }

  uiConsole(...args: unknown[]): void {
    const el = document.querySelector("#console-ui>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }
}
