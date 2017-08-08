// Initialize collapse button from materializecss.com
$('.button-collapse').sideNav();

//callback after map is successfully loaded to kick off the app
function kickOff(){

	var map;
	var infoWindow = new google.maps.InfoWindow({ maxWidth: 250 });

	//set up Map according to Google Maps API
	function initMap() {
		var center = {lat: 48.8584, lng: 2.2940}; //48.8566° N, 2.3522° E
	  map = new google.maps.Map(document.getElementById('map'), {
	    center: center,
	    zoom: 13,
	    mapTypeId: 'hybrid'
	  });

	  //stackoverflow Responsive Google Map?
		google.maps.event.addDomListener(window, "resize", function() {
			console.log("resizing");
			var center = map.getCenter();
			google.maps.event.trigger(map, "resize");
			map.setCenter(center); 
		});
	}

	initMap();

	//Place Constructor function containing all relevant place details
	function Place(position, name) {
		var self = this;
		self.name = name;
		self.position = position;
		self.marker = new google.maps.Marker({
	  	position: self.position,
	  	map: map,
	  	animation: google.maps.Animation.DROP
	  });

		self.marker.addListener('click', self.clickHandler);
		self.marker.title = self.name;
	}

	//clickHandler method for place objects to handle animating the place marker
	//pan to the location and infoWindow population from ajax request and response
	Place.prototype.clickHandler = function () {
		var self = this;
		infoWindow.close();
		map.panTo(self.getPosition());
		self.setAnimation(google.maps.Animation.BOUNCE);
		window.setTimeout(function() {
			self.setAnimation(null);
		}, 1500);

		populateInfoWindow(self);
	};

	//this helper function manages making the ajax request and populating the info window
	var populateInfoWindow = function(marker) {
		
		var content = '<h5>' + marker.title + '</h5><p>data</p><p>Attribution: Wikipedia</p>',
		url = 'https://en.wikipedia.org/w/api.php?format=json&action=query&origin=*&prop=extracts&explaintext&exsentences=1&titles=' + encodeURIComponent(marker.title);

		var text;
		infoWindow.open(map, marker);
		infoWindow.setContent(content);
		$.getJSON(url)
		.done(function(data) {
			text = parseResponse(data);
			content = content.replace(/data/, text);
		})
		.fail(function(jqxhr, textStatus, errcode) {
			text = "Unable to fetch content at this time.";
			content = content.replace(/data/, text);
			infoWindow.setContent('');
		})
		.always(function(){
			infoWindow.setContent(content);
		});
	};

	//helper function to extract and clean the required information from wikimedia API response
	function parseResponse(data){
		var arr = Object.keys(data.query.pages).map(function(v) {return data.query.pages[v];});
		//the first pattern is for removing brackets and their content
		//the second pattern is a specific hack for a case where the closing bracket was omitted after a comma
		//e.g. centre george pompidou's page
		return arr[0].extract.replace(/\s*\(.*?\)/g, '').replace(/\s*\(.*?\,/g, '');
	}

	var placesOfInterest = [
		new Place({lat: 48.8584, lng: 2.2945}, 'Eiffel Tower'),
		new Place({lat: 48.8867, lng: 2.3431}, 'Sacré-Cœur, Paris'), //48.8867° N, 2.3431° E
		new Place({lat: 48.8606, lng: 2.3376}, 'Louvre'), //48.8606° N, 2.3376°
		new Place({lat: 48.8530, lng: 2.3499}, 'Notre-Dame de Paris'), //48.8530° N, 2.3499° E
		new Place({lat: 48.8738, lng: 2.2950}, 'Arc de Triomphe'), //48.8738° N, 2.2950° E
		new Place({lat: 48.8656, lng: 2.3212}, 'Place de la Concorde'), //48.8656° N, 2.3212° E
		new Place({lat: 48.8600, lng: 2.3266}, 'Musée d\'Orsay'), //48.8600° N, 2.3266° E
		new Place({lat: 48.8635, lng: 2.3275}, 'Tuileries Garden'), //48.8635° N, 2.3275° E
		new Place({lat: 48.8606, lng: 2.3522}, 'Centre Georges Pompidou'), //48.8606° N, 2.3522° E
	];

	//KnockoutJS viewModel
	function AppViewModel() {
		var self = this;
		self.header = 'Paris Attractions';
		self.searchInput = ko.observable('');
		self.places = ko.observableArray(placesOfInterest);

		//call the Place clickhandler with the place object clicked
		self.onclick = function(place) {
			place.clickHandler.call(place.marker);
		};

		//filtering function to filter listView and markers based on searchInput
		//defaults to true before Place objects are created 
		self.doFiltering = function(place) {
			if(!place.marker) return true;
			if (self.searchInput() === '' || place.name.toLowerCase().indexOf(self.searchInput().toLowerCase()) !== -1 ) { 
				place.marker.setMap(map);
				return true; 
			} 
			else {
				place.marker.setMap(null);
				return false; 
			} 
		};
	}

	ko.applyBindings(new AppViewModel());

	//hide on clicking places in smaller displays
	$('.places').click(function(){
		 $('.button-collapse').sideNav('hide');
	});
}