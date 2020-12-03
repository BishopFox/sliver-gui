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
import { ActivatedRoute, Router } from '@angular/router';
import * as clientpb from 'sliver-script/lib/pb/clientpb/client_pb';

import { FadeInOut } from '@app/shared/animations';
import { JobsService } from '@app/providers/jobs.service';

@Component({
  selector: 'jobs-website-details',
  templateUrl: './website-details.component.html',
  styleUrls: ['./website-details.component.scss'],
  animations: [FadeInOut]
})
export class WebsiteDetailsComponent implements OnInit {

  name: string;
  website: clientpb.Website;

  constructor(private _route: ActivatedRoute,
              private _router: Router,
              private _jobsService: JobsService) { }

  ngOnInit(): void {
    this._route.params.subscribe((params) => {
      this.name = params['name']
      this._jobsService.websiteByName(this.name).then(website => {
        this.website = website;
      }).catch(() => {
        console.log(`No website with name ${this.name}`);
      });
    });
  }

  back() {
    window.history.back();
  }

}
