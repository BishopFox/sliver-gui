import * as CommonPB from 'sliver-script/lib/pb/commonpb/common_pb';
import * as ClientPB from 'sliver-script/lib/pb/clientpb/client_pb';
import * as SliverPB from 'sliver-script/lib/pb/sliverpb/sliver_pb';

import { Subject } from 'rxjs';
 

export class Sliver {

}

/* Export to 'window' */
declare global {
    interface Window { CommonPB: any; }
    interface Window { ClientPB: any; }
    interface Window { SliverPB: any; }
}

window.CommonPB = CommonPB;
window.ClientPB = ClientPB;
window.SliverPB = SliverPB;