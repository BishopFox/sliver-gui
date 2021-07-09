/*
  Sliver Implant Framework
  Copyright (C) 2021  Bishop Fox
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
import { SliverService } from '@app/providers/sliver.service';
import { FadeInOut } from '@app/shared/animations';


@Component({
  selector: 'loot-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  animations: [FadeInOut]
})
export class MainComponent implements OnInit {

  constructor(private _sliverService: SliverService) { }

  ngOnInit(): void {

  }

}
