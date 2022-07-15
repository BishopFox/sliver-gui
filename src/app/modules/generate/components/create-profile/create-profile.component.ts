/*
  Sliver Implant Framework
  Copyright (C) 2020  Bishop Fox
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';
import { SliverService } from '@app/providers/sliver.service';
import { FadeInOut } from '@app/shared/animations';


@Component({
  selector: 'generate-create-profile',
  templateUrl: './create-profile.component.html',
  styleUrls: ['./create-profile.component.scss'],
  animations: [FadeInOut]
})
export class CreateProfileComponent implements OnInit {

  implantConfig: clientpb.ImplantConfig;
  profileForm: UntypedFormGroup;

  constructor(private _router: Router,
              private _fb: UntypedFormBuilder,
              private _sliverService: SliverService) { }

  ngOnInit(): void {
    this.profileForm = this._fb.group({
      profileName: ['', Validators.required],
    });
  }

  async onImplantConfig(implantConfig: clientpb.ImplantConfig) {
    this.implantConfig = implantConfig;
  }

  implantProfile(): clientpb.ImplantProfile {
    const profile = new clientpb.ImplantProfile();
    profile.setName(this.profileForm.controls['profileName'].value);
    profile.setConfig(this.implantConfig);
    return profile;
  }

  async saveProfile() {
    const profile = this.implantProfile();
    await this._sliverService.saveImplantProfile(profile);
    this._router.navigate(['generate', 'profiles']);
  }

}
