import 'package:dfinity_wallet/ic_api/web/stringify.dart';
import 'package:dfinity_wallet/ui/_components/form_utils.dart';
import 'package:dfinity_wallet/ui/_components/valid_fields_submit_button.dart';
import 'package:dfinity_wallet/ui/transaction/create_transaction_overlay.dart';
import 'package:dfinity_wallet/ui/wallet/account_detail_widget.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';

import '../../dfinity.dart';

class AttachHardwareWalletWidget extends StatefulWidget {
  final String name;

  const AttachHardwareWalletWidget({Key? key, required this.name})
      : super(key: key);

  @override
  _AttachHardwareWalletWidgetState createState() =>
      _AttachHardwareWalletWidgetState();
}


class _AttachHardwareWalletWidgetState
    extends State<AttachHardwareWalletWidget> {
  ConnectionState connectionState = ConnectionState.NOT_CONNECTED;
  dynamic ledgerIdentity;
  
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: HardwareConnectionWidget(
                connectionState: connectionState,
                ledgerIdentity: ledgerIdentity,
                onConnectPressed: () async {
                  setState(() {
                    connectionState = ConnectionState.CONNECTING;
                  });
                  final ledgerIdentity =
                      await context.icApi.connectToHardwareWallet();
                  final json = stringify(ledgerIdentity);
                  print("identity ${json}");
                  setState(() {
                    this.ledgerIdentity = ledgerIdentity;
                    connectionState = ConnectionState.CONNECTED;
                  });
                }),
          ),
          SizedBox(
              height: 70,
              width: double.infinity,
              child: ElevatedButton(
                child: Text("Attach Wallet"),
                onPressed: (() async {
                  setState(() {
                    connectionState = ConnectionState.CONNECTING;
                  });

                  final account = Account.create(
                      name: widget.name,
                      accountIdentifier: ledgerIdentity.getPublicKey()!,
                      primary: false,
                      subAccountId: null,
                      balance: "0",
                      transactions: [],
                      neurons: null,
                      hardwareWallet: true);
                  context.boxes.accounts
                      .put(ledgerIdentity.getPublicKey(), account);
                  context.nav.push(AccountPageDef.createPageConfig(account));
                }).takeIf((e) => connectionState == ConnectionState.CONNECTED),
              ))
        ],
      ),
    );
  }
}

enum ConnectionState { NOT_CONNECTED, CONNECTING, CONNECTED }

class HardwareConnectionWidget extends StatelessWidget {
  final ConnectionState connectionState;
  final Function() onConnectPressed;
  final dynamic ledgerIdentity;

  const HardwareConnectionWidget(
      {Key? key,
      required this.connectionState,
      required this.ledgerIdentity,
      required this.onConnectPressed})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    switch (connectionState) {
      case ConnectionState.NOT_CONNECTED:
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: ElevatedButton(
                style: ButtonStyle(
                    backgroundColor:
                        MaterialStateProperty.all(AppColors.gray600)),
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Text(
                    "Connect to Wallet",
                    style: TextStyle(
                        fontSize: 30,
                        fontFamily: Fonts.circularBook,
                        color: AppColors.gray50,
                        fontWeight: FontWeight.w100),
                  ),
                ),
                onPressed: onConnectPressed),
          ),
        );
      case ConnectionState.CONNECTING:
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text("Connecting", style: context.textTheme.subtitle1),
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: SpinKitWanderingCubes(
                  color: Colors.white,
                  size: 100.0,
                  duration: 1.seconds,
                ),
              ),
            ],
          ),
        );
      case ConnectionState.CONNECTED:
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text("Connected to Hardware Wallet",
                    style: context.textTheme.subtitle1),
              ),
              if(ledgerIdentity != null)
                ...[
                  Text("Account Identifier", style: context.textTheme.bodyText1?.copyWith(fontSize: 14, color: AppColors.gray50),),
                  Text(getAccountIdentifier(ledgerIdentity)!, style: context.textTheme.subtitle2,),
                  SmallFormDivider(),
                  Text("Public Key", style: context.textTheme.bodyText1?.copyWith(fontSize: 14, color: AppColors.gray50),),
                  Text(getPublicKey(ledgerIdentity)!, style: context.textTheme.subtitle2,)
                ]
            ],
          ),
        );
    }
  }
}
